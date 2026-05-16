<?php
// app/Http/Controllers/Profile/EmployerProfileController.php

namespace App\Http\Controllers\Profile;

// Controllers
use App\Http\Controllers\Controller;

// Models
use App\Models\User;

// Requests
use Illuminate\Http\Request;

// Facades
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

// Validation
use Illuminate\Validation\Rule;

// Inertia
use Inertia\Inertia;

class EmployerProfileController extends Controller
{
    /**
     * Show the employer profile edit form.
     */
    public function edit()
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission instead of role
        if (!$user->hasPermission('employer_profile.edit')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to edit employer profile.');
        }

        // Get user's highest role for display
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
    public function update(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission instead of role
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

        return redirect()->back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Update the employer's password.
     */
    public function updatePassword(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission instead of role
        if (!$user->hasPermission('employer_profile.update_password')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to update password.');
        }

        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return back()->with('success', 'Password updated successfully.');
    }
}
