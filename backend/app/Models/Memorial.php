<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Memorial extends Model
{
    protected $fillable = ['name', 'about_html'];

    public function draft(): HasOne
    {
        return $this->hasOne(MemorialDraft::class);
    }
}
