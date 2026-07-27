<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Cache;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $user = $request->user();

        $roles = [];
        $permissions = [];
        $primaryRole = null;

        if ($user) {
            // Cache roles and permissions for 5 minutes to reduce DB load
            $cacheKey = 'user_roles_permissions_' . $user->id;
            $cached = Cache::remember($cacheKey, 300, function () use ($user) {
                $roles = $user->roles()
                    ->get(['roles.id', 'roles.name', 'roles.slug', 'roles.level'])
                    ->toArray();

                $permissions = $user->getAllPermissions();

                $primaryRole = null;
                if (!empty($roles)) {
                    // Highest level (lowest number) is most privileged
                    usort($roles, fn($a, $b) => $a['level'] <=> $b['level']);
                    $primaryRole = $roles[0]['slug'] ?? null;
                }

                return compact('roles', 'permissions', 'primaryRole');
            });

            $roles = $cached['roles'];
            $permissions = $cached['permissions'];
            $primaryRole = $cached['primaryRole'];
        }

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'google_id' => $user->google_id,
                    'google_avatar' => $user->google_avatar,
                    'email_verified_at' => $user->email_verified_at,
                    'created_at' => $user->created_at,
                    'roles' => $roles,
                    'permissions' => $permissions,
                    'primary_role' => $primaryRole, 
                ] : null,
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
                'warning' => session('warning'),
                'info' => session('info'),
            ],
            'notifications' => $user ? [
                'unread_count' => $user->unreadNotifications()->count(),
                'recent' => $user->notifications()
                    ->latest()
                    ->take(5)
                    ->get()
                    ->map(fn($notification) => [
                        'id' => $notification->id,
                        'data' => $notification->data,
                        'read_at' => $notification->read_at,
                        'created_at' => $notification->created_at,
                    ])
                    ->values(),
            ] : [
                'unread_count' => 0,
                'recent' => [],
            ],
        ]);
    }
}
