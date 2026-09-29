<?php
// app/Services/EmailTemplateRepository.php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use RuntimeException;

/**
 * ============================================================
 *  EMAIL TEMPLATE REPOSITORY
 * ============================================================
 *
 * The system email templates live as plain Blade files under
 * `resources/views/emails/`. They are not in the database: the
 * repository reads and writes them straight from disk, so an admin
 * can restyle a transactional email without a deploy.
 *
 * Responsibilities:
 *   - describe the known templates (label, purpose, variables)
 *   - read / write the Blade source safely
 *   - keep timestamped backups of every previous revision
 *   - expose sample data so the editor can render a live preview
 *
 * Every write is preceded by a backup, which makes the editor
 * effectively undo-able from the browser.
 */
class EmailTemplateRepository
{
    /**
     * Where the editable Blade templates live, relative to resources/views.
     */
    public const VIEW_DIRECTORY = 'emails';

    /**
     * Where revisions are kept, relative to storage/app.
     */
    public const BACKUP_DIRECTORY = 'email-templates';

    /**
     * How many revisions to keep per template.
     */
    public const BACKUP_LIMIT = 25;

    /**
     * The known templates. Adding a Blade file here is the only step
     * needed to make it editable from the admin UI.
     *
     * @var array<string, array<string, mixed>>
     */
    private const REGISTRY = [
        'newsletter-bulk' => [
            'label' => 'Campaign Email',
            'group' => 'Newsletter',
            'description' => 'Shell wrapped around every bulk newsletter campaign. Edit the header, footer, preheader and unsubscribe block here — the campaign body itself is authored in the campaign builder.',
            'used_by' => ['App\Mail\NewsletterBulkEmail'],
            'variables' => ['subject', 'previewText', 'firstName', 'content', 'unsubscribeUrl', 'year'],
        ],
        'newsletter-welcome' => [
            'label' => 'Subscribe Confirmation',
            'group' => 'Newsletter',
            'description' => 'Sent the moment somebody confirms a newsletter subscription.',
            'used_by' => ['App\Http\Controllers\NewsletterController::adminSendWelcome'],
            'variables' => ['name', 'unsubscribeUrl', 'year'],
        ],
        'newsletter-test' => [
            'label' => 'SMTP Test Ping',
            'group' => 'Newsletter',
            'description' => 'Troubleshooting email used to confirm the mail transport is alive. No merge variables.',
            'used_by' => ['App\Http\Controllers\NewsletterController::adminSendTest'],
            'variables' => [],
        ],
        'application' => [
            'label' => 'Applicant Email',
            'group' => 'Applications',
            'description' => 'Free-form message an admin sends to a job applicant (rejections, interview invites, updates). The typed message is injected through $content.',
            'used_by' => ['App\Mail\ApplicationEmail'],
            'variables' => ['subject', 'applicantName', 'jobTitle', 'companyName', 'applicationId', 'content'],
        ],
        'shortlisted' => [
            'label' => 'Shortlist Notification',
            'group' => 'Applications',
            'description' => 'Congratulations email sent when an applicant is shortlisted for a role.',
            'used_by' => ['(reserved — no sender wired up yet)'],
            'variables' => ['application', 'customMessage'],
        ],
        'verification' => [
            'label' => 'Email Verification',
            'group' => 'Account',
            'description' => 'Sent to new accounts that must confirm their email address before signing in.',
            'used_by' => ['App\Notifications\CustomVerifyEmailNotification'],
            'variables' => ['userName', 'verificationUrl'],
        ],
        'password-reset' => [
            'label' => 'Password Reset',
            'group' => 'Account',
            'description' => 'Sent when somebody asks to reset a forgotten password.',
            'used_by' => ['App\Notifications\CustomResetPasswordNotification'],
            'variables' => ['userName', 'resetUrl', 'appName', 'subject'],
        ],
    ];

    /* ==========================================================
     |  READ
     *========================================================== */

    /**
     * Every registered template, with live file metadata attached.
     *
     * @return array<int, array<string, mixed>>
     */
    public function templates(): array
    {
        return array_map(fn (string $slug, array $meta) => $this->describe($slug, $meta), array_keys(self::REGISTRY), self::REGISTRY);
    }

    /**
     * A single template descriptor, or null when the slug is unknown.
     *
     * @return array<string, mixed>|null
     */
    public function find(string $slug): ?array
    {
        if (!isset(self::REGISTRY[$slug])) {
            return null;
        }

        return $this->describe($slug, self::REGISTRY[$slug]);
    }

    public function exists(string $slug): bool
    {
        return isset(self::REGISTRY[$slug]) && File::exists($this->path($slug));
    }

    /**
     * Absolute path of a template's Blade file.
     */
    public function path(string $slug): string
    {
        $this->guard($slug);

        return resource_path('views/' . self::VIEW_DIRECTORY . '/' . $slug . '.blade.php');
    }

    /**
     * Raw Blade source.
     */
    public function read(string $slug): string
    {
        $path = $this->path($slug);

        if (!File::exists($path)) {
            return '';
        }

        return File::get($path);
    }

    /* ==========================================================
     |  WRITE
     *========================================================== */

    /**
     * Persist a new revision, keeping the previous one as a backup.
     *
     * @return array{bytes: int, backup: string|null}
     */
    public function write(string $slug, string $source): array
    {
        $path = $this->path($slug);

        if (!File::exists($path)) {
            throw new RuntimeException("Template [{$slug}] does not exist on disk.");
        }

        $backup = File::exists($path) ? $this->backup($slug) : null;

        // Write to a sibling temp file first so a failed write can never
        // leave a half-written template behind.
        File::put($path . '.tmp', $source);
        File::move($path . '.tmp', $path);

        $this->clearCompiledViews();

        return ['bytes' => strlen($source), 'backup' => $backup];
    }

    /**
     * Copy the current revision into the backup folder.
     *
     * @return string|null The backup filename, or null when the source is empty.
     */
    public function backup(string $slug): ?string
    {
        $source = $this->read($slug);

        if (trim($source) === '') {
            return null;
        }

        $directory = $this->backupDirectory($slug);
        File::ensureDirectoryExists($directory);

        $filename = Carbon::now()->format('Ymd-His') . '-' . substr(sha1($slug . Carbon::now()->timestamp), 0, 6) . '.blade.php';

        File::put($directory . '/' . $filename, $source);

        $this->pruneBackups($slug);

        return $filename;
    }

    /**
     * Newest-first list of stored revisions.
     *
     * @return array<int, array{filename: string, size: int, created_at: string}>
     */
    public function backups(string $slug): array
    {
        $this->guard($slug);

        $directory = $this->backupDirectory($slug);

        if (!File::isDirectory($directory)) {
            return [];
        }

        $items = [];

        foreach (File::files($directory) as $file) {
            $items[] = [
                'filename' => $file->getFilename(),
                'size' => $file->getSize(),
                'created_at' => Carbon::createFromTimestamp($file->getMTime())->toDateTimeString(),
            ];
        }

        usort($items, fn (array $a, array $b) => strcmp($b['filename'], $a['filename']));

        return $items;
    }

    /**
     * Read one stored revision.
     */
    public function readBackup(string $slug, string $filename): string
    {
        return File::get($this->backupPath($slug, $filename));
    }

    /**
     * Roll a template back to a stored revision (which is itself backed up
     * first, so a revert is never destructive).
     */
    public function restore(string $slug, string $filename): void
    {
        $source = $this->readBackup($slug, $filename);

        if (trim($source) === '') {
            throw new RuntimeException('That revision is empty and cannot be restored.');
        }

        $this->write($slug, $source);
    }

    /**
     * Absolute path of a stored revision, rejecting anything that tries to
     * escape the backup directory.
     */
    public function backupPath(string $slug, string $filename): string
    {
        $this->guard($slug);

        if (!preg_match('/^[A-Za-z0-9._-]+$/', $filename) || str_contains($filename, '..')) {
            throw new RuntimeException('Invalid revision filename.');
        }

        $directory = $this->backupDirectory($slug);
        $path = $directory . '/' . $filename;

        if (!File::exists($path)) {
            throw new RuntimeException('That revision no longer exists.');
        }

        return $path;
    }

    /* ==========================================================
     |  PREVIEW
     *========================================================== */

    /**
     * Sample merge data for a template, shaped exactly like the values the
     * real mailer passes in. The editor merges the admin's overrides on top
     * of this so a preview always shows a fully populated email.
     *
     * @return array<string, mixed>
     */
    public function sampleData(string $slug): array
    {
        $this->guard($slug);

        $appName = (string) config('app.name', 'Dwip Unnayan Sangstha');
        $appUrl = rtrim((string) config('app.url', 'https://example.test'), '/');
        $year = (string) Carbon::now()->year;

        $shared = [
            'year' => $year,
            'appName' => $appName,
            'name' => 'Ananya Sen',
            'userName' => 'Ananya Sen',
            'firstName' => 'Ananya',
            'applicantName' => 'Ananya Sen',
            'subject' => 'Sample subject line',
            'previewText' => 'A short teaser shown next to the subject in most inboxes.',
            'jobTitle' => 'Community Programme Coordinator',
            'companyName' => $appName,
            'applicationId' => 'APP-2026-0148',
            'unsubscribeUrl' => $appUrl . '/newsletter/unsubscribe/preview-token',
            'verificationUrl' => $appUrl . '/email/verify/preview-token?expires=preview',
            'resetUrl' => $appUrl . '/reset-password/preview-token?email=preview@example.test',
            'customMessage' => "We were impressed by your background and would like to meet you.\n\nThe interview is scheduled for Tuesday at 10:00 AM.",
        ];

        $samples = [
            'newsletter-bulk' => ['content' => $this->sampleCampaignBody()],
            'newsletter-welcome' => [],
            'newsletter-test' => [],
            'application' => ['content' => $this->sampleApplicationBody()],
            'shortlisted' => ['application' => $this->sampleApplicationRecord()],
            'verification' => [],
            'password-reset' => [],
        ];

        return array_merge($shared, $samples[$slug] ?? []);
    }

    /* ==========================================================
     |  INTERNALS
     *========================================================== */

    /**
     * Reject any slug that is not in the registry. This is the single
     * defence against path traversal in this class.
     */
    private function guard(string $slug): void
    {
        if (!isset(self::REGISTRY[$slug]) || !preg_match('/^[a-z0-9-]+$/', $slug)) {
            throw new RuntimeException('Unknown email template.');
        }
    }

    /**
     * @param  array<string, mixed>  $meta
     * @return array<string, mixed>
     */
    private function describe(string $slug, array $meta): array
    {
        $path = $this->path($slug);
        $exists = File::exists($path);

        return [
            'slug' => $slug,
            'label' => $meta['label'],
            'group' => $meta['group'],
            'description' => $meta['description'],
            'used_by' => $meta['used_by'],
            'variables' => $meta['variables'],
            'file' => 'resources/views/' . self::VIEW_DIRECTORY . '/' . $slug . '.blade.php',
            'exists' => $exists,
            'size' => $exists ? File::size($path) : 0,
            'lines' => $exists ? substr_count(File::get($path), "\n") + 1 : 0,
            'updated_at' => $exists ? Carbon::createFromTimestamp(File::lastModified($path))->toDateTimeString() : null,
            'revisions' => count($this->backups($slug)),
        ];
    }

    private function backupDirectory(string $slug): string
    {
        return storage_path('app/' . self::BACKUP_DIRECTORY . '/' . $slug);
    }

    /**
     * Drop the oldest revisions once the cap is exceeded.
     */
    private function pruneBackups(string $slug): void
    {
        $files = $this->backups($slug);

        foreach (array_slice($files, self::BACKUP_LIMIT) as $file) {
            File::delete($this->backupDirectory($slug) . '/' . $file['filename']);
        }
    }

    /**
     * Compiled Blade views are cached per path, so a rewritten template
     * keeps serving the old markup until the cache is dropped.
     */
    private function clearCompiledViews(): void
    {
        Artisan::call('view:clear');
    }

    /**
     * A campaign body used when previewing the bulk campaign shell.
     */
    private function sampleCampaignBody(): string
    {
        return <<<'HTML'
        <h1 style="margin:0 0 16px 0; font-size:24px; color:#0f172a;">Hello {{first_name}},</h1>
        <p style="margin:0 0 16px 0; line-height:1.6; color:#334155;">
          Here is what happened at {{app_name}} this month. Three new member
          organisations joined, two community grants closed, and the skills
          workshop in Barisal filled every seat.
        </p>
        <h2 style="margin:24px 0 8px 0; font-size:18px; color:#0f172a;">What to look out for</h2>
        <ul style="margin:0 0 16px 0; padding-left:20px; line-height:1.7; color:#334155;">
          <li>Annual general meeting — nominations open until the 15th.</li>
          <li>Volunteer training weekend, sign up through the portal.</li>
          <li>New photo gallery from the last field visit.</li>
        </ul>
        <p style="margin:24px 0;">
          <a href="#" style="display:inline-block; background:#009BE2; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none;">Read the full update</a>
        </p>
        HTML;
    }

    /**
     * The body injected into the applicant email template.
     */
    private function sampleApplicationBody(): string
    {
        return <<<'HTML'
        <p style="margin:0 0 16px 0; line-height:1.6; color:#334155;">
          Thank you for applying. We have reviewed your application for the
          <strong>Community Programme Coordinator</strong> role and would like
          to invite you to a short conversation with our selection panel.
        </p>
        <p style="margin:0; line-height:1.6; color:#334155;">
          Please reply with two times that suit you between 10:00 and 17:00.
        </p>
        HTML;
    }

    /**
     * A stand-in for the Application model. stdClass chains behave like the
     * Eloquent relations the real template walks through, and `??` on a
     * missing key stays quiet just as it does in production.
     */
    private function sampleApplicationRecord(): object
    {
        return json_decode(json_encode([
            'id' => 148,
            'applicant_name' => 'Ananya Sen',
            'status' => 'shortlisted',
            'jobListing' => [
                'id' => 42,
                'title' => 'Community Programme Coordinator',
                'user' => [
                    'name' => (string) config('app.name', 'Dwip Unnayan Sangstha'),
                ],
            ],
        ]));
    }
}
