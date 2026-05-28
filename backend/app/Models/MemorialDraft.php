<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemorialDraft extends Model
{
    protected $fillable = ['memorial_id', 'content_html'];

    public function memorial(): BelongsTo
    {
        return $this->belongsTo(Memorial::class);
    }
}
