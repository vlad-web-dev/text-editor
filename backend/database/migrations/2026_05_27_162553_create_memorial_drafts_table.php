<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('memorial_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('memorial_id')->constrained()->cascadeOnDelete();
            $table->longText('content_html');
            $table->timestamps();
            // One draft per memorial — enables updateOrCreate upsert in controller
            $table->unique('memorial_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('memorial_drafts');
    }
};
