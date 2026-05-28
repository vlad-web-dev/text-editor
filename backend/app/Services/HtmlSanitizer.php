<?php

namespace App\Services;

use HTMLPurifier;
use HTMLPurifier_Config;

class HtmlSanitizer
{
    private HTMLPurifier $purifier;

    public function __construct()
    {
        $config = HTMLPurifier_Config::createDefault();

        $config->set('HTML.Allowed',
            'p,br,strong,em,u,s,a[href],ul,ol,li,blockquote,h1,h2,h3,h4,h5,h6,hr,code,pre,span[style]'
        );

        // Allow only color and font-size in inline styles (used by the editor)
        $config->set('CSS.AllowedProperties', ['color', 'font-size', 'text-align']);

        // Force rel="noopener noreferrer" on all links
        $config->set('HTML.TargetBlank', true);
        $config->set('HTML.TargetNoopener', true);
        $config->set('HTML.TargetNoreferrer', true);

        // Disable caching to avoid needing a writable cache dir in tests/CI
        $config->set('Cache.DefinitionImpl', null);

        $this->purifier = new HTMLPurifier($config);
    }

    public function sanitize(string $html): string
    {
        return $this->purifier->purify($html);
    }
}
