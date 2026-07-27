<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EmployerProfileController extends Controller
{
    /**
     * Show the employer profile edit form.
     */
    public function edit(): Response|RedirectResponse
    {
        $user = $this->getAuthenticatedUser();

        if (!$user->hasPermission('employer_profile.edit')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to edit employer profile.');
        }

        $primaryRole = $user->roles()->orderBy('level', 'desc')->first();

        return Inertia::render('Backend/Profile/Employer/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'primary_role' => $primaryRole ? $primaryRole->name : 'Employer',
            ],
        ]);
    }

    /**
     * Update the employer's profile information (name, email).
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $this->getAuthenticatedUser();

        if (!$user->hasPermission('employer_profile.update')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to update employer profile.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                Rule::unique('users')->ignore($user->id),
            ],
        ]);

        $user->update($validated);

        SimpleLogger::security(
            "Employer profile updated: {$user->email}",
            [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $request->ip(),
                'changes' => array_keys($validated),
            ]
        );

        return redirect()->back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Update the employer's password – with rate limiting.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $user = $this->getAuthenticatedUser();

        if (!$user->hasPermission('employer_profile.update_password')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to update password.');
        }

        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Rate limiting: 5 password change attempts per minute
        $throttleKey = 'employer_password_change|' . $user->id;
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            SimpleLogger::security(
                "Password change rate limit exceeded for employer {$user->email}",
                ['user_id' => $user->id, 'ip' => $request->ip()]
            );
            throw ValidationException::withMessages([
                'current_password' => 'Too many attempts. Please wait a moment.',
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Clear throttle on success
        RateLimiter::clear($throttleKey);

        SimpleLogger::security(
            "Employer password updated: {$user->email}",
            [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return back()->with('success', 'Password updated successfully.');
    }

    /**
     * Get the authenticated user.
     */
    private function getAuthenticatedUser(): User
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            abort(401, 'Unauthenticated');
        }
        return $user;
    }
}