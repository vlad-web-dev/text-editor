<?php

namespace Tests\Feature;

use App\Models\Memorial;
use App\Models\MemorialDraft;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemorialControllerTest extends TestCase
{
    use RefreshDatabase;

    private Memorial $memorial;

    protected function setUp(): void
    {
        parent::setUp();

        $this->memorial = Memorial::create([
            'name'       => 'Test Memorial',
            'about_html' => '<p>Original about text</p>',
        ]);
    }

    // ─── GET /api/memorials/{memorial} ────────────────────────────────────────

    public function test_show_returns_memorial_data(): void
    {
        $this->getJson("/api/memorials/{$this->memorial->id}")
            ->assertOk()
            ->assertJson([
                'id'        => $this->memorial->id,
                'name'      => 'Test Memorial',
                'aboutHtml' => '<p>Original about text</p>',
            ]);
    }

    public function test_show_returns_404_for_nonexistent_memorial(): void
    {
        $this->getJson('/api/memorials/9999')
            ->assertNotFound();
    }

    // ─── PATCH /api/memorials/{memorial}/about ────────────────────────────────

    public function test_update_about_saves_new_html(): void
    {
        $this->patchJson("/api/memorials/{$this->memorial->id}/about", [
            'about_html' => '<p>Updated content</p>',
        ])
            ->assertOk()
            ->assertJson([
                'id'        => $this->memorial->id,
                'aboutHtml' => '<p>Updated content</p>',
            ]);

        $this->assertDatabaseHas('memorials', [
            'id'         => $this->memorial->id,
            'about_html' => '<p>Updated content</p>',
        ]);
    }

    public function test_update_about_clears_existing_draft(): void
    {
        MemorialDraft::create([
            'memorial_id' => $this->memorial->id,
            'content_html' => '<p>Old draft</p>',
        ]);

        $this->patchJson("/api/memorials/{$this->memorial->id}/about", [
            'about_html' => '<p>Saved</p>',
        ])->assertOk();

        $this->assertDatabaseMissing('memorial_drafts', [
            'memorial_id' => $this->memorial->id,
        ]);
    }

    public function test_update_about_strips_xss_payloads(): void
    {
        $this->patchJson("/api/memorials/{$this->memorial->id}/about", [
            'about_html' => '<p>Safe</p><script>alert(1)</script><img src=x onerror=alert(2)>',
        ])
            ->assertOk()
            ->assertJsonPath('aboutHtml', '<p>Safe</p>');
    }

    public function test_update_about_returns_422_when_about_html_missing(): void
    {
        $this->patchJson("/api/memorials/{$this->memorial->id}/about", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['about_html']);
    }

    public function test_update_about_returns_422_when_about_html_is_not_a_string(): void
    {
        $this->patchJson("/api/memorials/{$this->memorial->id}/about", [
            'about_html' => ['not', 'a', 'string'],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['about_html']);
    }

    // ─── GET /api/memorials/{memorial}/draft ──────────────────────────────────

    public function test_get_draft_returns_404_when_no_draft_exists(): void
    {
        $this->getJson("/api/memorials/{$this->memorial->id}/draft")
            ->assertNotFound()
            ->assertJson(['message' => 'No draft found']);
    }

    public function test_get_draft_returns_draft_content(): void
    {
        MemorialDraft::create([
            'memorial_id'  => $this->memorial->id,
            'content_html' => '<p>Draft content</p>',
        ]);

        $this->getJson("/api/memorials/{$this->memorial->id}/draft")
            ->assertOk()
            ->assertJson([
                'memorialId'  => $this->memorial->id,
                'contentHtml' => '<p>Draft content</p>',
            ])
            ->assertJsonStructure(['id', 'memorialId', 'contentHtml', 'updatedAt']);
    }

    // ─── POST /api/memorials/{memorial}/draft ─────────────────────────────────

    public function test_save_draft_creates_new_draft(): void
    {
        $this->postJson("/api/memorials/{$this->memorial->id}/draft", [
            'content_html' => '<p>My draft</p>',
        ])
            ->assertCreated()
            ->assertJson([
                'memorialId'  => $this->memorial->id,
                'contentHtml' => '<p>My draft</p>',
            ]);

        $this->assertDatabaseHas('memorial_drafts', [
            'memorial_id'  => $this->memorial->id,
            'content_html' => '<p>My draft</p>',
        ]);
    }

    public function test_save_draft_updates_existing_draft_instead_of_creating_duplicate(): void
    {
        MemorialDraft::create([
            'memorial_id'  => $this->memorial->id,
            'content_html' => '<p>First draft</p>',
        ]);

        $this->postJson("/api/memorials/{$this->memorial->id}/draft", [
            'content_html' => '<p>Updated draft</p>',
        ])->assertOk();

        // Still only one draft row
        $this->assertDatabaseCount('memorial_drafts', 1);

        $this->assertDatabaseHas('memorial_drafts', [
            'memorial_id'  => $this->memorial->id,
            'content_html' => '<p>Updated draft</p>',
        ]);
    }

    public function test_save_draft_returns_422_when_content_html_missing(): void
    {
        $this->postJson("/api/memorials/{$this->memorial->id}/draft", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['content_html']);
    }

    // ─── DELETE /api/memorials/{memorial}/draft ───────────────────────────────

    public function test_delete_draft_removes_existing_draft(): void
    {
        MemorialDraft::create([
            'memorial_id'  => $this->memorial->id,
            'content_html' => '<p>Draft</p>',
        ]);

        $this->deleteJson("/api/memorials/{$this->memorial->id}/draft")
            ->assertNoContent();

        $this->assertDatabaseMissing('memorial_drafts', [
            'memorial_id' => $this->memorial->id,
        ]);
    }

    public function test_delete_draft_succeeds_when_no_draft_exists(): void
    {
        // Should not throw — idempotent delete
        $this->deleteJson("/api/memorials/{$this->memorial->id}/draft")
            ->assertNoContent();
    }

    // ─── Multi-memorial isolation ─────────────────────────────────────────────

    public function test_draft_is_scoped_to_its_memorial(): void
    {
        $other = Memorial::create(['name' => 'Other', 'about_html' => '']);

        MemorialDraft::create([
            'memorial_id'  => $this->memorial->id,
            'content_html' => '<p>Memorial 1 draft</p>',
        ]);

        // Memorial 2 has no draft
        $this->getJson("/api/memorials/{$other->id}/draft")
            ->assertNotFound();

        // Memorial 1's draft is unaffected
        $this->getJson("/api/memorials/{$this->memorial->id}/draft")
            ->assertOk();
    }

    public function test_deleting_memorial_cascades_to_draft(): void
    {
        MemorialDraft::create([
            'memorial_id'  => $this->memorial->id,
            'content_html' => '<p>Draft</p>',
        ]);

        $this->memorial->delete();

        $this->assertDatabaseMissing('memorial_drafts', [
            'memorial_id' => $this->memorial->id,
        ]);
    }
}
