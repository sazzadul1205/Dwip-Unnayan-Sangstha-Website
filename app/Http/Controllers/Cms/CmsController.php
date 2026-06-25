<?php
// app/Http/Controllers/Cms/CmsController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\AboutContent;
use App\Models\pages\Blog;
use App\Models\pages\CustomSectionData;
use App\Models\pages\Page;
use App\Models\pages\Program;
use App\Models\pages\SectionConfig;
use App\Models\pages\SharedData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CMS Controller for Inertia.js Administration
 * 
 * This controller handles all CMS administrative functionality using Inertia.js
 * Provides CRUD operations for all content types based on the provided models
 * 
 * @package App\Http\Controllers\Cms
 */
class CmsController extends Controller
{

}
