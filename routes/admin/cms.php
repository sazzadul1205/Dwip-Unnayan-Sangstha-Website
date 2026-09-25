<?php

// ============================================
// CMS ROUTES
// URL: /backend/cms/*
// ============================================

// Facades
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\Cms\SharedDataController;
use App\Http\Controllers\Cms\EditorImageUploadController;
use App\Http\Controllers\Cms\PageController as CmsPageController;
use App\Http\Controllers\Cms\BlogController as CmsBlogController;
use App\Http\Controllers\Cms\ProgramController as CmsProgramController;
use App\Http\Controllers\Cms\SectionController as CmsSectionController;
use App\Http\Controllers\Cms\PublicationController as CmsPublicationController;
use App\Http\Controllers\Cms\AboutContentController as CmsAboutContentController;

Route::prefix('cms')->name('cms.')->group(function () {
  // Page Management
  Route::prefix('pages')->name('pages.')->group(function () {
    Route::get('/', [CmsPageController::class, 'index'])->name('index');
    Route::post('/store', [CmsPageController::class, 'store'])->name('store');
    Route::put('/update/{id}', [CmsPageController::class, 'update'])->name('update');
    Route::post('/toggle-status/{id}', [CmsPageController::class, 'toggleStatus'])->name('toggle-status');
    Route::delete('/destroy/{id}', [CmsPageController::class, 'destroy'])->name('destroy');
    Route::post('/restore/{id}', [CmsPageController::class, 'restore'])->name('restore');
    Route::delete('/force-delete/{id}', [CmsPageController::class, 'forceDelete'])->name('force-delete');
  });

  // Section Management
  Route::prefix('sections')->name('sections.')->group(function () {
    Route::get('/page/{pageId}', [CmsSectionController::class, 'index'])->name('page.sections');
    Route::post('/', [CmsSectionController::class, 'store'])->name('store');
    Route::post('/{pageId}/update-order', [CmsSectionController::class, 'updateOrder'])->name('update-order');
    Route::put('/update/{section}', [CmsSectionController::class, 'update'])->name('update');
    Route::delete('/{section}', [CmsSectionController::class, 'destroy'])->name('destroy');
    Route::post('/{section}/restore', [CmsSectionController::class, 'restore'])->name('restore');
    Route::delete('/{section}/force-delete', [CmsSectionController::class, 'forceDelete'])->name('force-delete');
    Route::get('/about-content-options', [CmsSectionController::class, 'getAboutContentOptions'])->name('about-content-options');
  });

  // Shared Data Management
  Route::prefix('shared')->name('shared.')->group(function () {
    Route::get('/', [SharedDataController::class, 'index'])->name('index');
    Route::put('/update/{id}', [SharedDataController::class, 'update'])->name('update');
  });

  // Blogs Management
  Route::prefix('blogs')->name('blogs.')->group(function () {
    Route::get('/', [CmsBlogController::class, 'index'])->name('index');
    Route::post('/store', [CmsBlogController::class, 'store'])->name('store');
    Route::put('/update/{id}', [CmsBlogController::class, 'update'])->name('update');
    Route::post('/toggle-status/{id}', [CmsBlogController::class, 'toggleStatus'])->name('toggle-status');
    Route::post('/toggle-featured/{id}', [CmsBlogController::class, 'toggleFeatured'])->name('toggle-featured');
    Route::delete('/destroy/{id}', [CmsBlogController::class, 'destroy'])->name('destroy');
    Route::post('/restore/{id}', [CmsBlogController::class, 'restore'])->name('restore');
    Route::delete('/force-delete/{id}', [CmsBlogController::class, 'forceDelete'])->name('force-delete');
  });

  // Programs Management
  Route::prefix('programs')->name('programs.')->group(function () {
    Route::get('/', [CmsProgramController::class, 'index'])->name('index');
    Route::post('/store', [CmsProgramController::class, 'store'])->name('store');
    Route::put('/update/{id}', [CmsProgramController::class, 'update'])->name('update');
    Route::post('/toggle-status/{id}', [CmsProgramController::class, 'toggleStatus'])->name('toggle-status');
    Route::post('/toggle-featured/{id}', [CmsProgramController::class, 'toggleFeatured'])->name('toggle-featured');
    Route::post('/update-order', [CmsProgramController::class, 'updateOrder'])->name('update-order');
    Route::delete('/destroy/{id}', [CmsProgramController::class, 'destroy'])->name('destroy');
    Route::post('/restore/{id}', [CmsProgramController::class, 'restore'])->name('restore');
    Route::delete('/force-delete/{id}', [CmsProgramController::class, 'forceDelete'])->name('force-delete');
  });

  // About Content Management
  Route::prefix('about')->name('about.')->group(function () {
    Route::get('/', [CmsAboutContentController::class, 'index'])->name('index');
    Route::post('/store', [CmsAboutContentController::class, 'store'])->name('store');
    Route::put('/update/{id}', [CmsAboutContentController::class, 'update'])->name('update');
    Route::post('/toggle-status/{id}', [CmsAboutContentController::class, 'toggleStatus'])->name('toggle-status');
    Route::post('/toggle-featured/{id}', [CmsAboutContentController::class, 'toggleFeatured'])->name('toggle-featured');
    Route::post('/update-order', [CmsAboutContentController::class, 'updateOrder'])->name('update-order');
    Route::delete('/destroy/{id}', [CmsAboutContentController::class, 'destroy'])->name('destroy');
    Route::post('/restore/{id}', [CmsAboutContentController::class, 'restore'])->name('restore');
    Route::delete('/force-delete/{id}', [CmsAboutContentController::class, 'forceDelete'])->name('force-delete');
  });

  // Publications Management
  Route::prefix('publications')->name('publications.')->group(function () {
    Route::get('/', [CmsPublicationController::class, 'index'])->name('index');
    Route::post('/store', [CmsPublicationController::class, 'store'])->name('store');
    Route::put('/update/{id}', [CmsPublicationController::class, 'update'])->name('update');
    Route::post('/toggle-status/{id}', [CmsPublicationController::class, 'toggleStatus'])->name('toggle-status');
    Route::post('/toggle-featured/{id}', [CmsPublicationController::class, 'toggleFeatured'])->name('toggle-featured');
    Route::delete('/destroy/{id}', [CmsPublicationController::class, 'destroy'])->name('destroy');
    Route::post('/restore/{id}', [CmsPublicationController::class, 'restore'])->name('restore');
    Route::delete('/force-delete/{id}', [CmsPublicationController::class, 'forceDelete'])->name('force-delete');
  });

  // Editor Image Upload
  Route::post('/upload-editor-image', [EditorImageUploadController::class, 'upload'])->name('upload-editor-image');
  Route::delete('/editor-image', [EditorImageUploadController::class, 'deleteImages'])->name('editor-image.delete');
});
