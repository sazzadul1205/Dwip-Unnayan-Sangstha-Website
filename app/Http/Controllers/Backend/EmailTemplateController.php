<?php
// app/Http/Controllers/Backend/EmailTemplateController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Mail\EmailTemplatePreview;
use App\Services\EmailTemplateRepository;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;

/**
 * ============================================================
 *  EMAIL TEMPLATE MANAGER
 * ============================================================
 *
 * Read / write access to the Blade email templates that live in
 * `resources/views/emails/`. There is no database behind this: the
 * editor writes the file, snapshots the previous revision, and drops
 * the compiled view cache so the change takes effect immediately.
 *
 * The UI is intentionally a plain source editor plus a live preview —
 * full HTML and CSS control with no database in the loop.
 */
class EmailTemplateController extends Controller
{
    public function __construct(private readonly EmailTemplateRepository $templates) {}

    /* ==========================================================
     |  INDEX
     *========================================================== */

    /**
     * Every editable template, grouped for the picker.
     */
    public function index(): Response|RedirectResponse
    {
        if (!$this->can('email_templates.view')) {
            return $this->deny('You do not have permission to view email templates.');
        }

        return Inertia::render('Backend/EmailTemplates/Index', [
            'templates' => $this->templates->templates(),
            'backupPath' => 'storage/app/' . EmailTemplateRepository::BACKUP_DIRECTORY,
            'viewPath' => 'resources/views/' . EmailTemplateRepository::VIEW_DIRECTORY,
            'can' => [
                'update' => $this->can('email_templates.update'),
                'send' => $this->can('email_templates.send'),
            ],
        ]);
    }

    /* ==========================================================
     |  EDIT / SAVE
     *========================================================== */

    /**
     * Source + preview context for one template.
     */
    public function edit(string $slug): Response|RedirectResponse
    {
        if (!$this->can('email_templates.view')) {
            return $this->deny('You do not have permission to view email templates.');
        }

        $template = $this->templates->find($slug);

        if (!$template) {
            return redirect()->route('backend.email-templates.index')->with('error', 'That email template does not exist.');
        }

        return Inertia::render('Backend/EmailTemplates/Editor', [
            'template' => $template,
            'source' => $this->templates->read($slug),
            'sampleData' => $this->templates->sampleData($slug),
            'revisions' => $this->templates->backups($slug),
            'html' => $this->renderForPreview($slug, $this->templates->read($slug), []),
            'can' => [
                'update' => $this->can('email_templates.update'),
                'send' => $this->can('email_templates.send'),
            ],
        ]);
    }

    /**
     * Write a new revision of the template to disk.
     */
    public function update(Request $request, string $slug): RedirectResponse
    {
        if (!$this->can('email_templates.update')) {
            return $this->deny('You do not have permission to edit email templates.');
        }

        if (!$this->templates->find($slug)) {
            return redirect()->route('backend.email-templates.index')->with('error', 'That email template does not exist.');
        }

        $validator = Validator::make($request->all(), [
            'source' => ['required', 'string', 'max:1000000'],
        ]);

        if ($validator->fails()) {
            return back()->with('error', $validator->errors()->first());
        }

        $source = (string) $request->input('source');

        if ($reason = $this->unsafeReason($source)) {
            return back()->with('error', $reason);
        }

        // Never persist markup that cannot be compiled.
        if ($error = $this->compileError($slug, $source)) {
            return back()->with('error', 'Blade could not compile this template: ' . $error);
        }

        try {
            $result = $this->templates->write($slug, $source);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        SimpleLogger::system('Email template updated', [
            'user_id' => Auth::id(),
            'template' => $slug,
            'bytes' => $result['bytes'],
        ]);

        return back()->with('success', sprintf(
            'Template saved (%s). A snapshot of the previous version is available under revisions.',
            number_format($result['bytes'] / 1024, 1) . ' KB'
        ));
    }

    /* ==========================================================
     |  PREVIEW
     *========================================================== */

    /**
     * Render unsaved editor content against sample data so the preview
     * pane updates as the admin types.
     */
    public function preview(Request $request, string $slug): JsonResponse
    {
        if (!$this->can('email_templates.view')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (!$this->templates->find($slug)) {
            return response()->json(['error' => 'Unknown template.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'source' => ['nullable', 'string', 'max:1000000'],
            'sample' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $sample = (array) $request->input('sample', []);

        // Must be a key => value map; a JSON list has nothing to merge into.
        if ($sample !== [] && array_is_list($sample)) {
            return response()->json(['error' => 'Sample data must be a JSON object of variable names.'], 422);
        }

        $source = (string) $request->input('source', $this->templates->read($slug));

        return response()->json([
            'html' => $this->renderForPreview($slug, $source, $sample),
        ]);
    }

    /* ==========================================================
     |  REVISIONS
     *========================================================== */

    /**
     * Restore a previous revision.
     */
    public function revert(Request $request, string $slug, string $file): RedirectResponse
    {
        if (!$this->can('email_templates.update')) {
            return $this->deny('You do not have permission to edit email templates.');
        }

        try {
            $this->templates->restore($slug, $file);
        } catch (RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        SimpleLogger::system('Email template revision restored', [
            'user_id' => Auth::id(),
            'template' => $slug,
            'revision' => $file,
        ]);

        return back()->with('success', 'Restored revision ' . $file . '. The version it replaced was snapshotted.');
    }

    /**
     * Download the current source as a file.
     */
    public function download(string $slug): SymfonyResponse
    {
        if (!$this->can('email_templates.view')) {
            abort(403);
        }

        $template = $this->templates->find($slug);

        if (!$template) {
            abort(404);
        }

        return response($this->templates->read($slug), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $slug . '.blade.php"',
        ]);
    }

    /* ==========================================================
     |  TEST SEND
     *========================================================== */

    /**
     * Email the template to one address so it can be judged in a real
     * inbox. Deliberately throttled.
     */
    public function sendTest(Request $request, string $slug): JsonResponse
    {
        if (!$this->can('email_templates.send')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (!$this->templates->find($slug)) {
            return response()->json(['error' => 'Unknown template.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email', 'max:255'],
            'source' => ['nullable', 'string', 'max:1000000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $user = Auth::user();
        $throttleKey = 'email_template_test|' . ($user?->getKey() ?? 'guest');

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            return response()->json(['error' => 'Too many test emails. Please wait a moment.'], 429);
        }

        $source = (string) $request->input('source', $this->templates->read($slug));
        $html = $this->renderForPreview($slug, $source, []);

        if (trim(strip_tags($html)) === '') {
            return response()->json(['error' => 'The template rendered empty — nothing to send.'], 422);
        }

        Mail::to($request->input('email'))->send(new EmailTemplatePreview(
            markup: $html,
            subjectLine: '[' . config('app.name') . '] Preview: ' . str_replace('-', ' ', $slug),
            recipient: (string) $request->input('email'),
        ));

        RateLimiter::hit($throttleKey, 60);

        SimpleLogger::system('Email template test sent', [
            'user_id' => $user?->getKey(),
            'template' => $slug,
            'to' => $request->input('email'),
        ]);

        return response()->json(['success' => true, 'message' => 'Preview sent to ' . $request->input('email') . '.']);
    }

    /* ==========================================================
     |  INTERNALS
     *========================================================== */

    /**
     * Compile the Blade source with the template's sample data.
     *
     * @param  array<string, mixed>  $overrides
     */
    private function renderForPreview(string $slug, string $source, array $overrides): string
    {
        try {
            $data = array_merge($this->templates->sampleData($slug), $overrides);

            // `deleteCachedView: true` so every keystroke re-compiles.
            return Blade::render($source, $data, true);
        } catch (Throwable $e) {
            return $this->renderError($e->getMessage());
        }
    }

    /**
     * Confirm the source is valid Blade before it ever touches disk.
     */
    private function compileError(string $slug, string $source): ?string
    {
        try {
            Blade::render($source, $this->templates->sampleData($slug), true);

            return null;
        } catch (Throwable $e) {
            return $e->getMessage();
        }
    }

    /**
     * Email templates are markup, not code. Refuse anything that could
     * execute PHP through the Blade compiler.
     */
    private function unsafeReason(string $source): ?string
    {
        if (preg_match('/<\?php|<\?=|<\?/', $source)) {
            return 'PHP blocks are not allowed in email templates.';
        }

        if (preg_match('/@php|@include|@extends|@inject/i', $source)) {
            return 'Directives such as @php and @include are not allowed in email templates.';
        }

        return null;
    }

    /**
     * Shown inside the preview pane when the template cannot compile.
     */
    private function renderError(string $message): string
    {
        $safe = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

        return <<<HTML
        <!DOCTYPE html><html><head><meta charset="UTF-8"><style>
        body{margin:0;padding:32px;background:#fef2f2;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#991b1b}
        h1{font-size:15px;margin:0 0 8px}pre{white-space:pre-wrap;font-size:13px;margin:0}
        </style></head><body><h1>Preview unavailable</h1><pre>{$safe}</pre></body></html>
        HTML;
    }

    private function can(string $permission): bool
    {
        $user = Auth::user();

        return $user && method_exists($user, 'hasPermission') && $user->hasPermission($permission);
    }

    private function deny(string $message): RedirectResponse
    {
        return redirect()->route('unauthorized.access')->with('error', $message);
    }
}
