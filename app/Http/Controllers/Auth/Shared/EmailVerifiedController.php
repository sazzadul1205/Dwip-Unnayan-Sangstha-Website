<?php

namespace App\Http\Controllers\Auth\Shared;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerifiedController extends Controller
{
  public function index(Request $request): Response|RedirectResponse
  {
    if (!$request->user() || !$request->user()->hasVerifiedEmail()) {
      return redirect()->route('verification.notice');
    }

    return Inertia::render('auth/JobSeeker/EmailVerified', [
      'status' => $request->session()->get('status'),
    ]);
  }
}
