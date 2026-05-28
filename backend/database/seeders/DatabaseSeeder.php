<?php

namespace Database\Seeders;

use App\Models\Memorial;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Memorial::create([
            'name' => 'In Loving Memory of John Doe',
            'about_html' => '<p>John was a kind and gentle soul who touched the lives of everyone he met. Born in 1948, he spent his life devoted to his family, his community, and his passion for gardening.</p><p>He had a gift for finding joy in simple moments — a perfect sunset, a shared meal, a child\'s laughter. His warmth and wisdom will be forever missed by all who knew him.</p><blockquote>The heart that gave, gathered.</blockquote>',
        ]);
    }
}
