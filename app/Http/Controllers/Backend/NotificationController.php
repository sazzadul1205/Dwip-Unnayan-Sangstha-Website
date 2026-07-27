<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Cache duration in seconds (1 minute – notifications change frequently).
     */
    protected int $cacheDuration = 60;

    /**
     * Rate limit max attempts per hour.
     */
    protected int $rateLimitAttempts = 20;

    /**
     * Display a paginated list of notifications for the authenticated user.
     */
    public function index(Request $request): Response
    {
        $user = $this->getAuthUser();

        // User‑specific cache key
        $cacheKey = 'notifications_index_' . $user->id . '_' . md5(json_encode($request->query()));

        $data = Cache::remember($cacheKey, $this->cacheDuration, function () use ($user, $request) {
            $notifications = $user->notifications()
                ->latest()
                ->paginate($request->input('per_page', 15))
                ->through(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => class_basename($notification->type),
                        'data' => $notification->data,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at,
                    ];
                });

            $unreadCount = $user->unreadNotifications()->count();

            return [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ];
        });

        return Inertia::render('Backend/Notifications/Index', $data);
    }

    /**
     * Mark a single notification as read – with rate limiting.
     */
    public function markAsRead(Request $request, string $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        $this->checkRateLimit('notification_mark_read', $user->id);

        try {
            $notification = $user->notifications()->findOrFail($id);

            if (!$notification->read_at) {
                $notification->markAsRead();
            }

            $this->clearCache($user->id);
            RateLimiter::clear($this->getThrottleKey('notification_mark_read', $user->id));

            SimpleLogger::security(
                "Notification marked as read: {$id}",
                [
                    'notification_id' => $id,
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'ip' => $request->ip(),
                ]
            );

            return back()->with('success', 'Notification marked as read.');
        } catch (\Exception $e) {
            Log::error('Failed to mark notification as read', [
                'notification_id' => $id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to mark notification as read.');
        }
    }

    /**
     * Mark all notifications as read – with rate limiting.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        $this->checkRateLimit('notification_mark_all_read', $user->id);

        try {
            $unreadCount = $user->unreadNotifications()->count();

            if ($unreadCount > 0) {
                $user->unreadNotifications()->update(['read_at' => now()]);
            }

            $this->clearCache($user->id);
            RateLimiter::clear($this->getThrottleKey('notification_mark_all_read', $user->id));

            SimpleLogger::security(
                "All notifications marked as read",
                [
                    'user_id' => $user->id,
                    'user_email' => $user->email,
                    'marked_count' => $unreadCount,
                    'ip' => $request->ip(),
                ]
            );

            return back()->with('success', 'All notifications marked as read.');
        } catch (\Exception $e) {
            Log::error('Failed to mark all notifications as read', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return back()->with('error', 'Failed to mark all notifications as read.');
        }
    }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

    /**
     * Get the authenticated user.
     */
    private function getAuthUser(): User
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            abort(401, 'Unauthenticated');
        }
        return $user;
    }

    /**
     * Check rate limit for notification actions.
     */
    private function checkRateLimit(string $action, int $userId, ?int $maxAttempts = null, int $decaySeconds = 3600): void
    {
        $max = $maxAttempts ?? $this->rateLimitAttempts;
        $key = $this->getThrottleKey($action, $userId);

        if (RateLimiter::tooManyAttempts($key, $max)) {
            Log::warning("Rate limit exceeded for {$action}", ['user_id' => $userId]);
            throw ValidationException::withMessages([
                'rate_limit' => 'Too many attempts. Please wait a moment.',
            ]);
        }
        RateLimiter::hit($key, $decaySeconds);
    }

    /**
     * Get throttle key.
     */
    private function getThrottleKey(string $action, int $userId): string
    {
        return "notification_{$action}|{$userId}";
    }

    /**
     * Clear notification cache for a specific user.
     */
    private function clearCache(int $userId): void
    {
        Cache::forget('notifications_index_' . $userId . '_*');
    }
}
