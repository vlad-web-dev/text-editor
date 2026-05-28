<?php

use App\Http\Controllers\Api\MemorialController;
use Illuminate\Support\Facades\Route;

Route::get('/memorials/{memorial}', [MemorialController::class, 'show']);
Route::patch('/memorials/{memorial}/about', [MemorialController::class, 'updateAbout']);
Route::get('/memorials/{memorial}/draft', [MemorialController::class, 'getDraft']);
Route::post('/memorials/{memorial}/draft', [MemorialController::class, 'saveDraft']);
Route::delete('/memorials/{memorial}/draft', [MemorialController::class, 'deleteDraft']);
