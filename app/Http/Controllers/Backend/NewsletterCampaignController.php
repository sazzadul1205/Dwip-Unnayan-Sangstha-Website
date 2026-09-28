<?php
// app/Http/Controllers/Backend/NewsletterCampaignController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Jobs\SendNewsletterBulkEmail;
use App\Mail\NewsletterBulkEmail;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterCampaignRecipient;
use App\Models\NewsletterSubscription;
use App\Services\NewsletterContentRenderer;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * ============================================================
 *  NEWSLETTER CAMPAIGN MANAGER
 * ============================================================
 *
 * Everything the "Campaigns" tab of the newsletter module needs:
 *
 *  - build / edit / duplicate / delete a campaign (HTML body + envelope)
 *  - send it to the selected audience, or keep it as a draft
 *  - inspect the per-recipient delivery ledger (who succeeded, who failed)
 *  - retry the failures, and export the stored HTML / recipient list
 */
class NewsletterCampaignController extends Controller
{
    public function __construct(private readonly NewsletterContentRenderer $renderer) {}

    /* ==========================================================
     |  INDEX
     |========================================================== */

    /**
     * Campaign list + the aggregate delivery statistics shown on top.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if (!$this->can('newsletter.view')) {
            return $this->deny('You do not have permission to view campaigns.');
        }

        return Inertia::render('Backend/Newsletter/Campaigns/Index', [
            'campaigns' => $this->listCampaigns($request),
            'summary' => $this->summary(),
            'filters' => [
                'status' => $request->input('status', 'all'),
                'search' => $request->input('search', ''),
            ],
            'audienceOptions' => $this->audienceOptions(),
            'mergeTags' => $this->renderer->availableMergeTags(),
        ]);
    }

    /**
     * Shared, filterable campaign query used by the index.
     */
    private function listCampaigns(Request $request, int $perPage = 12)
    {
        $query = NewsletterCampaign::query()->with('creator');

        $status = (string) $request->input('status', 'all');
        if ($status !== 'all' && $status !== '') {
            $query->where('status', $status);
        }

        $search = (string) $request->input('search', '');
        if ($search !== '') {
            $query->search($search);
        }

        return $query->orderByDesc('created_at')->paginate($perPage)->withQueryString();
    }

    /**
     * Headline numbers for the campaign dashboard.
     *
     * @return array<string, mixed>
     */
    private function summary(): array
    {
        $totals = NewsletterCampaign::query()
            ->selectRaw(<<<'SQL'
                COUNT(*)                                             AS campaigns,
                COALESCE(SUM(status = 'draft'), 0)                   AS drafts,
                COALESCE(SUM(status IN ('pending','processing')), 0) AS in_flight,
                COALESCE(SUM(total_subscribers), 0)                  AS attempted,
                COALESCE(SUM(sent_count), 0)                         AS sent,
                COALESCE(SUM(failed_count), 0)                       AS failed,
                COALESCE(SUM(bounced_count), 0)                      AS bounced
            SQL)
            ->first();

        $attempted = (int) $totals->attempted;
        $sent = (int) $totals->sent;
        $failed = (int) $totals->failed + (int) $totals->bounced;

        return [
            'campaigns' => (int) $totals->campaigns,
            'drafts' => (int) $totals->drafts,
            'in_flight' => (int) $totals->in_flight,
            'attempted' => $attempted,
            'sent' => $sent,
            'failed' => $failed,
            'bounced' => (int) $totals->bounced,
            'success_rate' => $attempted > 0 ? round(($sent / $attempted) * 100, 1) : 0.0,
            'failure_rate' => $attempted > 0 ? round(($failed / $attempted) * 100, 1) : 0.0,
            'active_subscribers' => NewsletterSubscription::subscribed()->count(),
        ];
    }

    /* ==========================================================
     |  CREATE / EDIT
     |========================================================== */

    /**
     * Blank "new campaign" form.
     */
    public function create(): Response|RedirectResponse
    {
        if (!$this->can('newsletter.send')) {
            return $this->deny('You do not have permission to create campaigns.');
        }

        return Inertia::render('Backend/Newsletter/Campaigns/Editor', [
            'campaign' => null,
            'audienceOptions' => $this->audienceOptions(),
            'mergeTags' => $this->renderer->availableMergeTags(),
            'template' => $this->starterTemplate(),
            'recipients' => $this->subscriberOptions(),
        ]);
    }

    /**
     * Edit an existing (usually draft) campaign.
     */
    public function edit(int $id): Response|RedirectResponse
    {
        if (!$this->can('newsletter.send')) {
            return $this->deny('You do not have permission to edit campaigns.');
        }

        $campaign = NewsletterCampaign::findOrFail($id);

        // A campaign that is mid-send must not be mutated â€“ its ledger and
        // stored HTML are the historical record.
        if ($campaign->isProcessing()) {
            return back()->with('error', 'This campaign is already sending and can no longer be edited.');
        }

        return Inertia::render('Backend/Newsletter/Campaigns/Editor', [
            'campaign' => $campaign->only([
                'id', 'subject', 'preview_text', 'from_name', 'from_email', 'reply_to',
                'html_content', 'content', 'audience_type', 'audience_meta', 'status',
            ]),
            'audienceOptions' => $this->audienceOptions(),
            'mergeTags' => $this->renderer->availableMergeTags(),
            'template' => $this->starterTemplate(),
            'recipients' => $this->subscriberOptions(),
        ]);
    }

    /**
     * Persist a campaign. `$request->boolean('send_now')` decides whether it is
     * stored as a draft or dispatched immediately.
     */
    public function store(Request $request): RedirectResponse
    {
        if (!$this->can('newsletter.send')) {
            return $this->deny('You do not have permission to create campaigns.');
        }

        $data = $this->validated($request);

        $campaign = NewsletterCampaign::create([
            ...$data,
            // Stored twice on purpose: `content` stays the canonical body for
            // backwards compatibility, `html_content` is the exact authored
            // copy the manager lets you review / copy / re-use.
            'content' => $data['html_content'],
            'status' => NewsletterCampaign::STATUS_DRAFT,
            'created_by' => $request->user()?->id,
        ]);

        if ($request->boolean('send_now')) {
            return $this->dispatchCampaign($campaign, $request);
        }

        SimpleLogger::users("Newsletter draft created: {$campaign->subject}", [
            'campaign_id' => $campaign->id,
            'user_id' => $request->user()?->id,
        ]);

        return redirect()
            ->route('backend.newsletter.campaigns.index')
            ->with('success', 'Draft saved. You can send it whenever you are ready.');
    }

    /**
     * Update an existing campaign and optionally send it.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        if (!$this->can('newsletter.send')) {
            return $this->deny('You do not have permission to edit campaigns.');
        }

        $campaign = NewsletterCampaign::findOrFail($id);

        if ($campaign->isProcessing()) {
            return back()->with('error', 'This campaign is already sending and can no longer be edited.');
        }

        $data = $this->validated($request);

        $campaign->fill([
            ...$data,
            'content' => $data['html_content'],
        ])->save();

        if ($request->boolean('send_now')) {
            return $this->dispatchCampaign($campaign, $request);
        }

        return redirect()
            ->route('backend.newsletter.campaigns.index')
            ->with('success', 'Campaign updated.');
    }

    /**
     * Validate + normalise the campaign payload coming from the editor.
     *
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $audienceTypes = implode(',', [
            NewsletterCampaign::AUDIENCE_ALL_ACTIVE,
            NewsletterCampaign::AUDIENCE_FILTERED,
            NewsletterCampaign::AUDIENCE_SELECTED,
        ]);

        $validator = Validator::make($request->all(), [
            'subject' => ['required', 'string', 'max:255'],
            'preview_text' => ['nullable', 'string', 'max:255'],
            'from_name' => ['nullable', 'string', 'max:120'],
            'from_email' => ['nullable', 'email', 'max:255'],
            'reply_to' => ['nullable', 'email', 'max:255'],
            'html_content' => ['required', 'string', 'max:2000000'],
            'audience_type' => ['required', 'in:' . $audienceTypes],
            'audience_meta' => ['nullable', 'array'],
            'audience_meta.status' => ['nullable', 'string', 'max:50'],
            'audience_meta.source' => ['nullable', 'string', 'max:50'],
            'audience_meta.ids' => ['nullable', 'array'],
            'audience_meta.ids.*' => ['integer', 'exists:newsletter_subscriptions,id'],
            'send_now' => ['nullable', 'boolean'],
        ], [
            'subject.required' => 'A subject line is required.',
            'html_content.required' => 'The email body cannot be empty.',
        ]);

        $validator->validate();

        $meta = $request->input('audience_meta', []);
        $meta = is_array($meta) ? $meta : [];

        return [
            'subject' => trim((string) $request->input('subject')),
            'preview_text' => $request->filled('preview_text') ? trim((string) $request->input('preview_text')) : null,
            'from_name' => $request->filled('from_name') ? trim((string) $request->input('from_name')) : null,
            'from_email' => $request->filled('from_email') ? trim((string) $request->input('from_email')) : null,
            'reply_to' => $request->filled('reply_to') ? trim((string) $request->input('reply_to')) : null,
            'html_content' => (string) $request->input('html_content'),
            'audience_type' => (string) $request->input('audience_type'),
            'audience_meta' => $meta ?: null,
        ];
    }

    /* ==========================================================
     |  DISPATCH
     |========================================================== */

    /**
     * Send a stored campaign to its resolved audience.
     *
     * Creates one ledger row per recipient first (status = pending) so the
     * Campaign Manager shows the full plan immediately, then hands the jobs
     * to a queue batch. Each job flips its own row to sent / failed / bounced.
     */
    private function dispatchCampaign(NewsletterCampaign $campaign, Request $request): RedirectResponse
    {
        $user = $request->user();

        // Throttle: bulk sends are expensive and easy to fat-finger.
        $throttleKey = 'newsletter_campaign_send|' . ($user?->id ?? 0);
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            return back()->with('error', 'Too many campaigns sent in a short time. Please wait a moment.');
        }
        RateLimiter::hit($throttleKey, 60);

        $recipients = $this->resolveAudience($campaign);

        if ($recipients->isEmpty()) {
            return back()->with('error', 'No active subscribers matched the selected audience.');
        }

        // Materialise the ledger up-front.
        $rows = [];
        $now = now();

        foreach ($recipients as $subscriber) {
            $rows[] = [
                'newsletter_campaign_id' => $campaign->id,
                'newsletter_subscription_id' => $subscriber->id,
                'email' => $subscriber->email,
                'name' => $subscriber->name,
                'status' => NewsletterCampaignRecipient::STATUS_PENDING,
                'attempts' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            NewsletterCampaignRecipient::insert($chunk);
        }

        $campaign->forceFill([
            'total_subscribers' => $recipients->count(),
            'sent_count' => 0,
            'failed_count' => 0,
            'bounced_count' => 0,
            'status' => NewsletterCampaign::STATUS_PROCESSING,
            'started_at' => $now,
            'completed_at' => null,
        ])->save();

        $jobs = NewsletterCampaignRecipient::forCampaign($campaign->id)
            ->where('status', NewsletterCampaignRecipient::STATUS_PENDING)
            ->get()
            ->map(fn (NewsletterCampaignRecipient $row) => new SendNewsletterBulkEmail(
                $row->subscription()->first() ?? new NewsletterSubscription([
                    'email' => $row->email,
                    'name' => $row->name,
                ]),
                $campaign,
                $row
            ));

        $batch = Bus::batch($jobs)
            ->then(function () use ($campaign): void {
                $campaign->refresh()->syncCountersFromLedger();
            })
            ->catch(function (\Throwable $e) use ($campaign): void {
                // Some jobs failed â€“ recompute the real numbers from the ledger
                // instead of trusting the batch counters.
                $campaign->refresh()->syncCountersFromLedger();

                Log::error('Newsletter campaign batch failed', [
                    'campaign_id' => $campaign->id,
                    'error' => $e->getMessage(),
                ]);
            })
            ->finally(function () use ($campaign): void {
                $campaign->refresh()->syncCountersFromLedger();
            })
            ->dispatch();

        $campaign->forceFill(['batch_id' => $batch->id])->save();

        SimpleLogger::security("Newsletter campaign dispatched", [
            'user_id' => $user?->id,
            'campaign_id' => $campaign->id,
            'count' => $recipients->count(),
        ]);

        return redirect()
            ->route('backend.newsletter.campaigns.show', $campaign->id)
            ->with('success', "Campaign queued. {$recipients->count()} emails are being sent.");
    }

    /**
     * Turn the stored audience definition into a concrete subscriber set.
     *
     * @return \Illuminate\Support\Collection<int, NewsletterSubscription>

    /* ==========================================================
     |  CAMPAIGN DETAIL + DELIVERY LEDGER
     |========================================================== */

    /**
     * Campaign detail: envelope, stats and the per-recipient ledger.
     */
    public function show(Request $request, int $id): Response|RedirectResponse
    {
        if (!$this->can('newsletter.view')) {
            return $this->deny('You do not have permission to view campaigns.');
        }

        $campaign = NewsletterCampaign::with('creator')->findOrFail($id);

        // Self-heal the aggregate counters from the ledger so the numbers stay
        // correct even if a worker died mid-batch.
        $campaign->syncCountersFromLedger();
        $campaign->refresh();

        return Inertia::render('Backend/Newsletter/Campaigns/Show', [
            'campaign' => $campaign,
            'recipients' => $this->ledgerQuery($request, $campaign)->paginate(20)->withQueryString(),
            'breakdown' => $this->ledgerBreakdown($campaign),
            'filters' => [
                'status' => $request->input('status', 'all'),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * Filterable ledger query (who received it, who failed and why).
     */
    private function ledgerQuery(Request $request, NewsletterCampaign $campaign)
    {
        $query = NewsletterCampaignRecipient::forCampaign($campaign->id);

        $status = (string) $request->input('status', 'all');
        if ($status === 'delivered') {
            $query->sent();
        } elseif (in_array($status, ['failed', 'bounced'], true)) {
            $query->where('status', $status);
        } elseif ($status === 'queued') {
            $query->pending();
        }

        $search = (string) $request->input('search', '');
        if ($search !== '') {
            $query->search($search);
        }

        return $query->orderByDesc('id');
    }

    /**
     * Per-status counts shown as the filter chips above the ledger table.
     *
     * @return array<string, int>
     */
    private function ledgerBreakdown(NewsletterCampaign $campaign): array
    {
        $counts = $campaign->recipients()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return [
            'all' => (int) $counts->sum(),
            'delivered' => (int) ($counts[NewsletterCampaignRecipient::STATUS_SENT] ?? 0),
            'failed' => (int) ($counts[NewsletterCampaignRecipient::STATUS_FAILED] ?? 0),
            'bounced' => (int) ($counts[NewsletterCampaignRecipient::STATUS_BOUNCED] ?? 0),
            'queued' => (int) ($counts[NewsletterCampaignRecipient::STATUS_PENDING] ?? 0),
        ];
    }

    /* ==========================================================
     |  ACTIONS
     |========================================================== */

    /**
     * Re-queue only the rows that failed or bounced.
     */
    public function retryFailed(int $id): RedirectResponse
    {
        if (!$this->can('newsletter.send')) {
            return $this->deny('You do not have permission to send campaigns.');
        }

        $campaign = NewsletterCampaign::findOrFail($id);
        $rows = $campaign->failedRecipients()->get();

        if ($rows->isEmpty()) {
            return back()->with('error', 'There are no failed recipients to retry.');
        }

        // Reset the rows so the batch can pick them up again.
        $rows->each(function (NewsletterCampaignRecipient $row): void {
            $row->forceFill([
                'status' => NewsletterCampaignRecipient::STATUS_PENDING,
                'error_message' => null,
            ])->save();
        });

        $campaign->forceFill(['status' => NewsletterCampaign::STATUS_PROCESSING])->save();

        $jobs = $rows->map(function (NewsletterCampaignRecipient $row) use ($campaign) {
            $subscriber = $row->subscription()->first()
                ?? new NewsletterSubscription(['email' => $row->email, 'name' => $row->name]);

            return new SendNewsletterBulkEmail($subscriber, $campaign, $row);
        });

        Bus::batch($jobs)
            ->catch(fn () => $campaign->refresh()->syncCountersFromLedger())
            ->finally(fn () => $campaign->refresh()->syncCountersFromLedger())
            ->dispatch();

        SimpleLogger::security("Newsletter campaign retry", [
            'user_id' => Auth::id(),
            'campaign_id' => $campaign->id,
            'count' => $rows->count(),
        ]);

        return back()->with('success', "Retrying {$rows->count()} failed recipient(s).");
    }

    /**
     * Clone a campaign (body + envelope) into a fresh draft.
     */
    public function duplicate(int $id): RedirectResponse
    {
        if (!$this->can('newsletter.send')) {
            return $this->deny('You do not have permission to create campaigns.');
        }

        $source = NewsletterCampaign::findOrFail($id);

        $copy = $source->replicate([
            'status', 'sent_count', 'failed_count', 'bounced_count',
            'batch_id', 'started_at', 'completed_at', 'created_at', 'updated_at',
        ]);

        $copy->status = NewsletterCampaign::STATUS_DRAFT;
        $copy->created_by = Auth::id();
        $copy->save();

        return redirect()
            ->route('backend.newsletter.campaigns.edit', $copy->id)
            ->with('success', 'Campaign duplicated as a new draft.');
    }

    public function destroy(int $id): RedirectResponse
    {
        if (!$this->can('newsletter.delete')) {
            return $this->deny('You do not have permission to delete campaigns.');
        }

        $campaign = NewsletterCampaign::findOrFail($id);

        if ($campaign->isProcessing()) {
            return back()->with('error', 'This campaign is currently sending and cannot be deleted.');
        }

        $campaign->delete(); // recipient rows cascade via the foreign key

        SimpleLogger::security("Newsletter campaign deleted", [
            'user_id' => Auth::id(),
            'campaign_id' => $id,
        ]);

        return back()->with('success', 'Campaign deleted.');
    }

    /* ==========================================================
     |  EXPORTS
     |========================================================== */

    /**
     * Download the exact stored HTML of a campaign so the admin can copy it,
     * archive it or re-use it in another ESP.
     */
    public function exportHtml(int $id): StreamedResponse
    {
        if (!$this->can('newsletter.view')) {
            abort(403, 'You do not have permission to export campaigns.');
        }

        $campaign = NewsletterCampaign::findOrFail($id);
        $body = (string) ($campaign->html_content ?: $campaign->content);

        $filename = 'campaign-' . $campaign->id . '-' . str($campaign->subject)->slug() . '.html';

        return response()->streamDownload(function () use ($campaign, $body): void {
            echo "// Subject: {$campaign->subject}\n";
            echo "// Preview: {$campaign->preview_text}\n";
            echo "// From: " . ($campaign->from_name ?: config('app.name'))
                . ' <' . ($campaign->from_email ?: config('mail.from.address')) . ">\n";
            echo "// Created: " . ($campaign->created_at?->toDateTimeString() ?? '') . "\n";
            echo "// ---\n\n";
            echo $body;
        }, $filename, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    /**
     * Download the delivery ledger as CSV (email, status, error, timestamp).
     */
    public function exportRecipients(Request $request, int $id): StreamedResponse
    {
        if (!$this->can('newsletter.export')) {
            abort(403, 'You do not have permission to export newsletter data.');
        }

        $campaign = NewsletterCampaign::findOrFail($id);
        $rows = $this->ledgerQuery($request, $campaign)->get();

        $filename = 'campaign-' . $campaign->id . '-recipients-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Email', 'Name', 'Status', 'Error', 'Attempts', 'Sent At']);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row->email,
                    $row->name ?? '',
                    $row->status_label,
                    $row->error_message ?? '',
                    $row->attempts,
                    $row->sent_at?->toDateTimeString() ?? '',
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /* ==========================================================
     |  PREVIEW + TEST SEND
     |========================================================== */

    /**
     * Render arbitrary editor HTML against a sample subscriber so the live
     * preview shows exactly what a recipient will receive.
     */
    public function preview(Request $request): JsonResponse
    {
        if (!$this->can('newsletter.view')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'html_content' => ['nullable', 'string', 'max:2000000'],
            'subject' => ['nullable', 'string', 'max:255'],
            'preview_text' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $html = (string) $request->input('html_content', '');
        $subject = (string) $request->input('subject', '');
        $preview = (string) $request->input('preview_text', '');

        $sample = $this->sampleSubscription();

        return response()->json([
            'html' => $this->renderer->render($html, $this->renderer->mergeMap($sample)),
            'analysis' => $this->renderer->analyse($html, $subject, $preview),
        ]);
    }

    /**
     * Send the current editor content to a single address for review.
     */
    public function sendTest(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !$user->hasPermission('newsletter.send')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $throttleKey = 'newsletter_campaign_test|' . $user->getKey();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            return response()->json([
                'success' => false,
                'message' => 'Too many test emails. Please wait a moment.',
            ], 429);
        }

        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'preview_text' => ['nullable', 'string', 'max:255'],
            'from_name' => ['nullable', 'string', 'max:120'],
            'from_email' => ['nullable', 'email', 'max:255'],
            'html_content' => ['required', 'string', 'max:2000000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $sample = $this->sampleSubscription($request->input('email'));

        // A transient (unsaved) campaign so the real mailable + Blade template
        // are exercised exactly as they will be for a live send.
        $campaign = new NewsletterCampaign([
            'subject' => $request->input('subject'),
            'preview_text' => $request->input('preview_text'),
            'from_name' => $request->input('from_name'),
            'from_email' => $request->input('from_email'),
        ]);

        $rendered = $this->renderer->render(
            (string) $request->input('html_content'),
            $this->renderer->mergeMap($sample)
        );

        try {
            Mail::to($sample->email)->send(new NewsletterBulkEmail($sample, $campaign, $rendered));

            RateLimiter::clear($throttleKey);

            SimpleLogger::security("Newsletter test email sent", [
                'user_id' => $user->getKey(),
                'to' => $sample->email,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Test email sent to {$sample->email}.",
            ]);
        } catch (\Throwable $e) {
            Log::error('Newsletter test send failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to send the test email: ' . $e->getMessage(),
            ], 500);
        }
    }

    /* ==========================================================
     |  HELPERS
     |========================================================== */

    /**
     * A throwaway subscription providing realistic merge-tag values for the
     * live preview and test sends.
     */
    private function sampleSubscription(string $email = 'preview@example.com'): NewsletterSubscription
    {
        $sample = new NewsletterSubscription([
            'email' => $email,
            'name' => 'Preview Recipient',
        ]);

        $sample->token = \Illuminate\Support\Str::random(64);

        return $sample;
    }

    /**
     * Targeting options offered in the editor.
     *
     * @return array<int, array{value: string, label: string, hint: string, count: int}>
     */
    private function audienceOptions(): array
    {
        $active = NewsletterSubscription::subscribed()->count();

        return [
            [
                'value' => NewsletterCampaign::AUDIENCE_ALL_ACTIVE,
                'label' => 'All active subscribers',
                'hint' => 'Everyone currently subscribed',
                'count' => $active,
            ],
            [
                'value' => NewsletterCampaign::AUDIENCE_FILTERED,
                'label' => 'Filtered segment',
                'hint' => 'Narrow by status or source',
                'count' => $active,
            ],
            [
                'value' => NewsletterCampaign::AUDIENCE_SELECTED,
                'label' => 'Hand-picked recipients',
                'hint' => 'Pick individual subscribers',
                'count' => $active,
            ],
        ];
    }

    /**
     * Compact subscriber list for the recipient picker.
     *
     * @return array<int, array{id: int, email: string, name: string|null, source: string}>
     */
    private function subscriberOptions(int $limit = 500): array
    {
        return NewsletterSubscription::subscribed()
            ->orderByDesc('subscribed_at')
            ->limit($limit)
            ->get(['id', 'email', 'name', 'source'])
            ->map(fn (NewsletterSubscription $s) => [
                'id' => $s->id,
                'email' => $s->email,
                'name' => $s->name,
                'source' => $s->source,
            ])
            ->all();
    }

    /**
     * Starting HTML offered when an admin opens a blank campaign.
     */
    private function starterTemplate(): string
    {
        return <<<'HTML'
<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#33455c;">
    <p style="margin:0 0 16px 0;">Hi {{first_name}},</p>

    <p style="margin:0 0 16px 0;">
        Here is what is new this week. We have pulled together the most important
        updates for you.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="margin:0 0 20px 0;border-collapse:collapse;">
        <tr>
            <td style="padding:18px 20px;background:#f2f7fb;border-radius:8px;border-left:4px solid #009BE2;">
                <p style="margin:0 0 6px 0;font-size:17px;font-weight:700;color:#0f233c;">Highlight of the week</p>
                <p style="margin:0;font-size:15px;line-height:24px;color:#4a5b70;">
                    Replace this block with your main story, announcement or featured content.
                </p>
            </td>
        </tr>
    </table>

    <p style="margin:0 0 22px 0;">
        <a href="{{site_url}}"
            style="display:inline-block;background:#009BE2;color:#ffffff;text-decoration:none;
                   padding:13px 26px;border-radius:6px;font-size:15px;font-weight:600;">
            Read the full story
        </a>
    </p>

    <p style="margin:0;font-size:13px;color:#8a9aad;">
        You are receiving this because you subscribed to {{app_name}}.
        <a href="{{unsubscribe_url}}" style="color:#009BE2;">Unsubscribe</a>
    </p>
</div>
HTML;
    }

    /**
     * Permission gate.
     */
    private function can(string $permission): bool
    {
        $user = Auth::user();

        return $user && method_exists($user, 'hasPermission') && $user->hasPermission($permission);
    }

    /**
     * Standard "not allowed" redirect.
     */
    private function deny(string $message): RedirectResponse
    {
        return redirect()->route('unauthorized.access')->with('error', $message);
    }

}
