<?php

namespace App\Http\Controllers;

use App\Models\NewsletterSubscription;
use App\Mail\NewsletterWelcomeEmail;
use App\Mail\NewsletterTestEmail;
use App\Mail\NewsletterBulkEmail;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class NewsletterController extends Controller
{
  /**
   * Subscribe to newsletter – with rate limiting.
   */
  public function subscribe(Request $request)
  {
    $throttleKey = 'newsletter_subscribe|' . $request->ip();
    if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
      Log::warning('Newsletter subscribe rate limit exceeded', ['ip' => $request->ip()]);
      return response()->json([
        'success' => false,
        'message' => 'Too many subscription attempts. Please wait a moment.',
      ], 429);
    }

    $validator = Validator::make($request->all(), [
      'email' => 'required|email|max:255',
      'name' => 'nullable|string|max:255',
      'source' => 'nullable|string|max:50',
    ]);

    if ($validator->fails()) {
      return response()->json([
        'success' => false,
        'errors' => $validator->errors(),
      ], 422);
    }

    try {
      $subscription = NewsletterSubscription::findOrCreateByEmail(
        $request->email,
        $request->name,
        $request->source ?? 'website'
      );

      try {
        Mail::to($subscription->email)->send(new NewsletterWelcomeEmail($subscription));
      } catch (\Exception $mailError) {
        Log::error('Failed to send welcome email: ' . $mailError->getMessage(), [
          'email' => $subscription->email,
        ]);
      }

      RateLimiter::clear($throttleKey);

      SimpleLogger::users(
        "Newsletter subscription: {$subscription->email}",
        ['email' => $subscription->email, 'source' => $request->source ?? 'website', 'ip' => $request->ip()]
      );

      return response()->json([
        'success' => true,
        'message' => 'Successfully subscribed to the newsletter!',
        'data' => [
          'email' => $subscription->email,
          'status' => $subscription->status,
        ],
      ]);
    } catch (\Exception $e) {
      Log::error('Newsletter subscription failed: ' . $e->getMessage(), [
        'email' => $request->email,
        'trace' => $e->getTraceAsString(),
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to subscribe. Please try again later.',
      ], 500);
    }
  }

  /**
   * Unsubscribe via token.
   */
  public function unsubscribe(Request $request, string $token)
  {
    $throttleKey = 'newsletter_unsubscribe|' . $request->ip();
    if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
      return response()->json([
        'success' => false,
        'message' => 'Too many attempts. Please wait a moment.',
      ], 429);
    }

    $subscription = NewsletterSubscription::findByToken($token);

    if (!$subscription) {
      return response()->json([
        'success' => false,
        'message' => 'Invalid unsubscribe token.',
      ], 404);
    }

    if (!$subscription->isSubscribed()) {
      return response()->json([
        'success' => false,
        'message' => 'You are already unsubscribed.',
      ], 400);
    }

    $subscription->unsubscribe();

    RateLimiter::clear($throttleKey);

    SimpleLogger::users(
      "Newsletter unsubscribed: {$subscription->email}",
      ['email' => $subscription->email, 'ip' => $request->ip()]
    );

    return response()->json([
      'success' => true,
      'message' => 'You have been successfully unsubscribed.',
    ]);
  }

  /**
   * Unsubscribe via email.
   */
  public function unsubscribeByEmail(Request $request)
  {
    $throttleKey = 'newsletter_unsubscribe_email|' . $request->ip();
    if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
      return response()->json([
        'success' => false,
        'message' => 'Too many attempts. Please wait a moment.',
      ], 429);
    }

    $validator = Validator::make($request->all(), [
      'email' => 'required|email|exists:newsletter_subscriptions,email',
    ]);

    if ($validator->fails()) {
      return response()->json([
        'success' => false,
        'errors' => $validator->errors(),
      ], 422);
    }

    $subscription = NewsletterSubscription::byEmail($request->email)->first();

    if (!$subscription || !$subscription->isSubscribed()) {
      return response()->json([
        'success' => false,
        'message' => 'You are not subscribed to our newsletter.',
      ], 400);
    }

    $subscription->unsubscribe();

    RateLimiter::clear($throttleKey);

    SimpleLogger::users(
      "Newsletter unsubscribed (email): {$request->email}",
      ['email' => $request->email, 'ip' => $request->ip()]
    );

    return response()->json([
      'success' => true,
      'message' => 'You have been successfully unsubscribed.',
    ]);
  }

  /**
   * Resubscribe.
   */
  public function resubscribe(Request $request, string $token)
  {
    $throttleKey = 'newsletter_resubscribe|' . $request->ip();
    if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
      return response()->json([
        'success' => false,
        'message' => 'Too many attempts. Please wait a moment.',
      ], 429);
    }

    $subscription = NewsletterSubscription::findByToken($token);

    if (!$subscription) {
      return response()->json([
        'success' => false,
        'message' => 'Invalid token.',
      ], 404);
    }

    if ($subscription->isSubscribed()) {
      return response()->json([
        'success' => false,
        'message' => 'You are already subscribed.',
      ], 400);
    }

    $subscription->resubscribe();

    RateLimiter::clear($throttleKey);

    SimpleLogger::users(
      "Newsletter resubscribed: {$subscription->email}",
      ['email' => $subscription->email, 'ip' => $request->ip()]
    );

    return response()->json([
      'success' => true,
      'message' => 'You have been successfully resubscribed.',
    ]);
  }

  /**
   * Get subscription status.
   */
  public function status(Request $request)
  {
    $throttleKey = 'newsletter_status|' . $request->ip();
    if (RateLimiter::tooManyAttempts($throttleKey, 20)) {
      return response()->json([
        'success' => false,
        'message' => 'Too many requests. Please wait a moment.',
      ], 429);
    }

    $validator = Validator::make($request->all(), [
      'email' => 'required|email',
    ]);

    if ($validator->fails()) {
      return response()->json([
        'success' => false,
        'errors' => $validator->errors(),
      ], 422);
    }

    $subscription = NewsletterSubscription::byEmail($request->email)->first();

    return response()->json([
      'success' => true,
      'data' => [
        'email' => $request->email,
        'is_subscribed' => $subscription && $subscription->isSubscribed(),
        'status' => $subscription ? $subscription->status : 'not_found',
      ],
    ]);
  }

    /* ==========================================
     | ADMIN METHODS
     |========================================== */

  /**
   * Admin: List all subscribers.
   * Return type: Response|RedirectResponse to handle unauthorized redirect.
   */
  public function adminIndex(Request $request): Response|RedirectResponse
  {
    $user = Auth::user();
    if (!$user instanceof User || !$user->hasPermission('newsletter.view')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to view newsletter subscribers.');
    }

    $query = NewsletterSubscription::query();

    if ($request->input('status') && $request->input('status') !== 'all') {
      $query->where('status', $request->input('status'));
    }

    if ($request->filled('search')) {
      $search = $request->input('search');
      $query->where(function ($q) use ($search) {
        $q->where('email', 'like', "%{$search}%")
          ->orWhere('name', 'like', "%{$search}%");
      });
    }

    $sortField = $request->input('sort', 'subscribed_at');
    $sortDirection = $request->input('direction', 'desc');
    $query->orderBy($sortField, $sortDirection);

    $subscribers = $query->paginate(15);

    $stats = [
      'total' => NewsletterSubscription::count(),
      'subscribed' => NewsletterSubscription::subscribed()->count(),
      'unsubscribed' => NewsletterSubscription::unsubscribed()->count(),
      'bounced' => NewsletterSubscription::where('status', 'bounced')->count(),
      'today' => NewsletterSubscription::whereDate('subscribed_at', today())->count(),
    ];

    return Inertia::render('Backend/Newsletter/Index', [
      'subscribers' => $subscribers,
      'stats' => $stats,
      'filters' => [
        'status' => $request->input('status', 'all'),
        'search' => $request->input('search', ''),
      ],
    ]);
  }

  /**
   * Admin: Export subscribers.
   */
  public function adminExport(Request $request): RedirectResponse|SymfonyResponse
  {
    $user = Auth::user();
    if (!$user instanceof User || !$user->hasPermission('newsletter.export')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to export newsletter subscribers.');
    }

    $validator = Validator::make($request->all(), [
      'status' => 'nullable|in:all,subscribed,unsubscribed,bounced',
      'format' => 'nullable|in:csv,excel',
    ]);

    if ($validator->fails()) {
      return response()->json(['errors' => $validator->errors()], 422);
    }

    $query = NewsletterSubscription::query();
    if ($request->input('status') && $request->input('status') !== 'all') {
      $query->where('status', $request->input('status'));
    }

    $subscribers = $query->get();

    $headers = [
      'Content-Type' => 'text/csv',
      'Content-Disposition' => 'attachment; filename="newsletter-subscribers-' . date('Y-m-d') . '.csv"',
    ];

    $callback = function () use ($subscribers) {
      $file = fopen('php://output', 'w');
      fputcsv($file, ['ID', 'Email', 'Name', 'Status', 'Subscribed At', 'Unsubscribed At', 'Source']);
      foreach ($subscribers as $subscriber) {
        fputcsv($file, [
          $subscriber->id,
          $subscriber->email,
          $subscriber->name ?? '',
          $subscriber->status,
          $subscriber->subscribed_at,
          $subscriber->unsubscribed_at,
          $subscriber->source ?? '',
        ]);
      }
      fclose($file);
    };

    SimpleLogger::security(
      "Newsletter export by {$user->email}",
      ['user_id' => $user->id, 'count' => $subscribers->count()]
    );

    return response()->stream($callback, 200, $headers);
  }

  /**
   * Admin: Bulk delete subscribers.
   */
  public function adminBulkDelete(Request $request): \Illuminate\Http\JsonResponse
  {
    $user = Auth::user();
    if (!$user instanceof User || !$user->hasPermission('newsletter.delete')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $validator = Validator::make($request->all(), [
      'ids' => 'required|array',
      'ids.*' => 'integer|exists:newsletter_subscriptions,id',
    ]);

    if ($validator->fails()) {
      return response()->json([
        'success' => false,
        'errors' => $validator->errors(),
      ], 422);
    }

    $count = NewsletterSubscription::whereIn('id', $request->ids)->delete();

    SimpleLogger::security(
      "Newsletter bulk delete by {$user->email}",
      ['user_id' => $user->id, 'count' => $count, 'ids' => $request->ids]
    );

    return response()->json([
      'success' => true,
      'message' => "{$count} subscriber(s) deleted successfully.",
      'count' => $count,
    ]);
  }

  /**
   * Admin: Bulk unsubscribe subscribers – FIXED METHOD.
   */
  public function adminBulkUnsubscribe(Request $request): \Illuminate\Http\JsonResponse
  {
    $user = Auth::user();
    if (!$user instanceof User || !$user->hasPermission('newsletter.update')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $validator = Validator::make($request->all(), [
      'ids' => 'required|array',
      'ids.*' => 'integer|exists:newsletter_subscriptions,id',
    ]);

    if ($validator->fails()) {
      return response()->json([
        'success' => false,
        'errors' => $validator->errors(),
      ], 422);
    }

    // Get the actual models, then loop
    $subscribers = NewsletterSubscription::whereIn('id', $request->ids)
      ->where('status', NewsletterSubscription::STATUS_SUBSCRIBED)
      ->get();

    $count = 0;
    foreach ($subscribers as $subscriber) {
      $subscriber->unsubscribe();
      $count++;
    }

    SimpleLogger::security(
      "Newsletter bulk unsubscribe by {$user->email}",
      ['user_id' => $user->id, 'count' => $count]
    );

    return response()->json([
      'success' => true,
      'message' => "{$count} subscriber(s) unsubscribed successfully.",
      'count' => $count,
    ]);
  }

  /**
   * Admin: Delete single subscriber.
   */
  public function adminDestroy(int $id): \Illuminate\Http\JsonResponse
  {
    $user = Auth::user();
    if (!$user instanceof User || !$user->hasPermission('newsletter.delete')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $subscriber = NewsletterSubscription::findOrFail($id);
    $subscriber->delete();

    SimpleLogger::security(
      "Newsletter subscriber deleted by {$user->email}",
      ['user_id' => $user->id, 'subscriber_id' => $id]
    );

    return response()->json([
      'success' => true,
      'message' => 'Subscriber deleted successfully.',
    ]);
  }

  /**
   * Admin: Unsubscribe single subscriber.
   */
  public function adminUnsubscribe(int $id): \Illuminate\Http\JsonResponse
  {
    $user = Auth::user();
    if (!$user instanceof User || !$user->hasPermission('newsletter.update')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $subscriber = NewsletterSubscription::findOrFail($id);

    if (!$subscriber->isSubscribed()) {
      return response()->json([
        'success' => false,
        'message' => 'Subscriber is already unsubscribed.',
      ], 400);
    }

    $subscriber->unsubscribe();

    SimpleLogger::security(
      "Newsletter subscriber unsubscribed by {$user->email}",
      ['user_id' => $user->id, 'subscriber_id' => $id]
    );

    return response()->json([
      'success' => true,
      'message' => 'Subscriber unsubscribed successfully.',
    ]);
  }

  /**
   * Admin: Resubscribe single subscriber.
   */
  public function adminResubscribe(int $id): \Illuminate\Http\JsonResponse
  {
    $user = Auth::user();
    if (!$user instanceof User || !$user->hasPermission('newsletter.update')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $subscriber = NewsletterSubscription::findOrFail($id);

    if ($subscriber->isSubscribed()) {
      return response()->json([
        'success' => false,
        'message' => 'Subscriber is already subscribed.',
      ], 400);
    }

    $subscriber->resubscribe();

    SimpleLogger::security(
      "Newsletter subscriber resubscribed by {$user->email}",
      ['user_id' => $user->id, 'subscriber_id' => $id]
    );

    return response()->json([
      'success' => true,
      'message' => 'Subscriber resubscribed successfully.',
    ]);
  }

  /**
   * Admin: Send test email.
   */
  public function adminSendTest(Request $request): \Illuminate\Http\JsonResponse
  {
    $user = Auth::user();
    if (!$user instanceof User || !$user->hasPermission('newsletter.send')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $throttleKey = 'newsletter_test_email|' . $user->id;
    if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
      return response()->json([
        'success' => false,
        'message' => 'Too many test email requests. Please wait a moment.',
      ], 429);
    }

    $validator = Validator::make($request->all(), [
      'email' => 'required|email',
      'subject' => 'nullable|string|max:255',
    ]);

    if ($validator->fails()) {
      return response()->json([
        'success' => false,
        'errors' => $validator->errors(),
      ], 422);
    }

    try {
      Mail::to($request->email)->send(new NewsletterTestEmail(
        $request->input('subject') ?? 'Newsletter Test Email'
      ));

      RateLimiter::clear($throttleKey);

      SimpleLogger::security(
        "Newsletter test email sent by {$user->email}",
        ['user_id' => $user->id, 'to' => $request->email]
      );

      return response()->json([
        'success' => true,
        'message' => "Test email sent to {$request->email} successfully.",
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to send test email: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to send test email: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Admin: Send bulk email.
   */
  public function sendBulkEmail(Request $request): \Illuminate\Http\JsonResponse
  {
    $user = Auth::user();
    if (!$user instanceof User || !$user->hasPermission('newsletter.send')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $throttleKey = 'newsletter_bulk_email|' . $user->id;
    if (RateLimiter::tooManyAttempts($throttleKey, 2)) {
      return response()->json([
        'success' => false,
        'message' => 'Too many bulk email requests. Please wait a moment.',
      ], 429);
    }

    $validator = Validator::make($request->all(), [
      'ids' => 'required|array',
      'ids.*' => 'integer|exists:newsletter_subscriptions,id',
      'subject' => 'required|string|max:255',
      'content' => 'required|string',
    ]);

    if ($validator->fails()) {
      return response()->json([
        'success' => false,
        'errors' => $validator->errors(),
      ], 422);
    }

    $subscribers = NewsletterSubscription::whereIn('id', $request->ids)
      ->where('status', NewsletterSubscription::STATUS_SUBSCRIBED)
      ->get();

    if ($subscribers->isEmpty()) {
      return response()->json([
        'success' => false,
        'message' => 'No active subscribers selected.',
      ], 400);
    }

    $sentCount = 0;
    $failedCount = 0;

    foreach ($subscribers as $subscriber) {
      try {
        Mail::to($subscriber->email)->send(new NewsletterBulkEmail(
          $subscriber,
          $request->input('subject'),
          $request->input('content')
        ));
        $sentCount++;
      } catch (\Exception $e) {
        Log::error('Failed to send bulk email: ' . $e->getMessage(), [
          'email' => $subscriber->email,
          'subject' => $request->input('subject'),
        ]);
        $failedCount++;
      }
    }

    RateLimiter::clear($throttleKey);

    SimpleLogger::security(
      "Newsletter bulk email sent by {$user->email}",
      ['user_id' => $user->id, 'sent' => $sentCount, 'failed' => $failedCount]
    );

    return response()->json([
      'success' => true,
      'message' => "Emails sent: {$sentCount}, Failed: {$failedCount}",
      'sent' => $sentCount,
      'failed' => $failedCount,
    ]);
  }
}
