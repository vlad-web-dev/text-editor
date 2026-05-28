<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveDraftRequest;
use App\Http\Requests\UpdateAboutRequest;
use App\Http\Resources\MemorialResource;
use App\Models\Memorial;
use Illuminate\Http\JsonResponse;

class MemorialController extends Controller
{
    public function show(Memorial $memorial): MemorialResource
    {
        return new MemorialResource($memorial);
    }

    public function updateAbout(UpdateAboutRequest $request, Memorial $memorial): MemorialResource
    {
        // TODO (production): sanitize $html through HTMLPurifier to prevent XSS
        $memorial->update(['about_html' => $request->validated('about_html')]);

        // Clear draft on explicit save
        $memorial->draft()->delete();

        return new MemorialResource($memorial);
    }

    public function getDraft(Memorial $memorial): JsonResponse
    {
        $draft = $memorial->draft;

        if (! $draft) {
            return response()->json(['message' => 'No draft found'], 404);
        }

        return response()->json([
            'id'          => $draft->id,
            'memorialId'  => $draft->memorial_id,
            'contentHtml' => $draft->content_html,
            'updatedAt'   => $draft->updated_at,
        ]);
    }

    public function saveDraft(SaveDraftRequest $request, Memorial $memorial): JsonResponse
    {
        // The unique index on memorial_id makes this a true upsert (one draft per memorial)
        $draft = $memorial->draft()->updateOrCreate(
            ['memorial_id' => $memorial->id],
            ['content_html' => $request->validated('content_html')]
        );

        return response()->json([
            'id'          => $draft->id,
            'memorialId'  => $draft->memorial_id,
            'contentHtml' => $draft->content_html,
            'updatedAt'   => $draft->updated_at,
        ], $draft->wasRecentlyCreated ? 201 : 200);
    }

    public function deleteDraft(Memorial $memorial): JsonResponse
    {
        $memorial->draft()->delete();

        return response()->json(null, 204);
    }
}
