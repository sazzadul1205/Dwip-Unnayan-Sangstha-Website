<?php

use App\Mail\EmailTemplatePreview;
use App\Services\EmailTemplateRepository;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;

uses(Tests\Support\RouteTestHelpers::class);

/**
 * The editor writes real files, so every test here snapshots the template
 * it touches and puts the original back afterwards.
 */
beforeEach(function () {
    $this->original = File::get(resource_path('views/emails/newsletter-test.blade.php'));
    $this->backupDir = storage_path('app/' . EmailTemplateRepository::BACKUP_DIRECTORY);
});

afterEach(function () {
    File::put(resource_path('views/emails/newsletter-test.blade.php'), $this->original);
    File::deleteDirectory($this->backupDir);
});

describe('Email template authentication', function () {
    it('redirects guests to login', function () {
        $this->get('/backend/email-templates')->assertRedirect('/login');
        $this->get('/backend/email-templates/newsletter-test/edit')->assertRedirect('/login');
    });

    it('denies users without the permission', function () {
        $this->actingAs($this->createJobSeekerUser());

        $this->get('/backend/email-templates')->assertRedirect(route('unauthorized.access'));
        $this->get('/backend/email-templates/newsletter-test/edit')->assertRedirect(route('unauthorized.access'));
    });

    it('refuses writes from users without the update permission', function () {
        $this->actingAs($this->createJobSeekerUser());

        $this->put('/backend/email-templates/newsletter-test', ['source' => 'nope'])->assertRedirect(route('unauthorized.access'));

        expect(File::get(resource_path('views/emails/newsletter-test.blade.php')))->toBe($this->original);
    });
});

describe('Email template browser', function () {
    beforeEach(function () {
        $this->actingAs($this->createAdminUser());
    });

    it('lists every registered template', function () {
        $this->get('/backend/email-templates')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('templates')->has('viewPath'));
    });

    it('opens the editor with the raw source and a rendered preview', function () {
        $this->get('/backend/email-templates/newsletter-test/edit')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('template.slug', 'newsletter-test')
                ->where('source', $this->original)
                ->has('html')
                ->has('revisions'));
    });

    it('sends the template source as a download', function () {
        $this->get('/backend/email-templates/newsletter-test/download')
            ->assertOk()
            ->assertHeader('Content-Disposition', 'attachment; filename="newsletter-test.blade.php"');
    });

    it('404s an unknown template', function () {
        $this->get('/backend/email-templates/not-a-template/edit')->assertRedirect(route('backend.email-templates.index'));
    });
});

describe('Email template writing', function () {
    beforeEach(function () {
        $this->actingAs($this->createAdminUser());
    });

    it('writes the file and snapshots the previous revision', function () {
        $source = '<html><body><h1>Rewritten</h1></body></html>';

        $this->put('/backend/email-templates/newsletter-test', ['source' => $source])
            ->assertRedirect()
            ->assertSessionHas('success');

        expect(File::get(resource_path('views/emails/newsletter-test.blade.php')))->toBe($source);

        $revisions = File::files($this->backupDir . '/newsletter-test');
        expect($revisions)->toHaveCount(1);
        expect(File::get($revisions[0]->getPathname()))->toBe($this->original);
    });

    it('restores a previous revision', function () {
        $this->put('/backend/email-templates/newsletter-test', ['source' => 'first revision'])->assertRedirect();

        $revisions = File::files($this->backupDir . '/newsletter-test');
        expect($revisions)->toHaveCount(1);

        $this->post('/backend/email-templates/newsletter-test/revisions/' . $revisions[0]->getFilename() . '/restore')
            ->assertRedirect()
            ->assertSessionHas('success');

        expect(File::get(resource_path('views/emails/newsletter-test.blade.php')))->toBe($this->original);
    });

    it('rejects PHP and privileged Blade directives', function () {
        $this->put('/backend/email-templates/newsletter-test', ['source' => '<?php echo 1; ?>'])
            ->assertSessionHas('error');

        $this->put('/backend/email-templates/newsletter-test', ['source' => '@php dump(1) @endphp'])
            ->assertSessionHas('error');

        $this->put('/backend/email-templates/newsletter-test', ['source' => '@include("secrets")'])
            ->assertSessionHas('error');

        expect(File::get(resource_path('views/emails/newsletter-test.blade.php')))->toBe($this->original);
    });

    it('rejects uncompilable Blade', function () {
        $this->put('/backend/email-templates/newsletter-test', ['source' => '@if(true) never closed'])
            ->assertSessionHas('error');

        expect(File::get(resource_path('views/emails/newsletter-test.blade.php')))->toBe($this->original);
    });
});

describe('Email template preview', function () {
    beforeEach(function () {
        $this->actingAs($this->createAdminUser());
    });

    it('renders unsaved source with sample data', function () {
        $response = $this->postJson('/backend/email-templates/verification/preview', [
            'source' => '<p>Hello {{ $userName }}</p>',
            'sample' => ['userName' => 'Preview Person'],
        ]);

        $response->assertOk();
        expect($response->json('html'))->toContain('Hello Preview Person');
    });

    it('reports a compile failure instead of blowing up', function () {
        $response = $this->postJson('/backend/email-templates/verification/preview', [
            'source' => '@if(true) never closed',
        ]);

        $response->assertOk();
        expect($response->json('html'))->toContain('Preview unavailable');
    });

    it('rejects a non-object sample payload', function () {
        $this->postJson('/backend/email-templates/verification/preview', ['sample' => ['a', 'b']])
            ->assertStatus(422);
    });

    it('404s an unknown template', function () {
        $this->postJson('/backend/email-templates/not-a-template/preview', ['source' => 'x'])->assertStatus(404);
    });
});

describe('Email template test send', function () {
    it('mails the rendered template to the given address', function () {
        Mail::fake();

        $this->actingAs($this->createAdminUser());

        $this->postJson('/backend/email-templates/newsletter-test/test-send', [
            'email' => 'reviewer@example.test',
            'source' => '<p>SMTP check</p>',
        ])->assertOk()->assertJson(['success' => true]);

        Mail::assertSent(EmailTemplatePreview::class, function (EmailTemplatePreview $mail) {
            return $mail->hasTo('reviewer@example.test')
                && str_contains($mail->markup, 'SMTP check')
                && str_contains($mail->subjectLine, 'newsletter test');
        });
    });

    it('validates the recipient address', function () {
        Mail::fake();

        $this->actingAs($this->createAdminUser());

        $this->postJson('/backend/email-templates/newsletter-test/test-send', ['email' => 'not-an-email'])
            ->assertStatus(422);
    });
});

describe('Email template repository', function () {
    it('refuses to resolve a path outside the template directory', function () {
        $repository = app(EmailTemplateRepository::class);

        expect(fn () => $repository->path('../../../.env'))->toThrow(RuntimeException::class);
    });

    it('describes every template on disk', function () {
        $templates = app(EmailTemplateRepository::class)->templates();

        expect($templates)->not->toBeEmpty();

        foreach ($templates as $template) {
            expect($template['exists'])->toBeTrue();
            expect($template['file'])->toStartWith('resources/views/emails/');
            expect($template['size'])->toBeGreaterThan(0);
        }
    });

    it('supplies sample data for every merge variable a template declares', function () {
        $repository = app(EmailTemplateRepository::class);

        foreach ($repository->templates() as $template) {
            $sample = $repository->sampleData($template['slug']);

            foreach ($template['variables'] as $variable) {
                expect($sample)->toHaveKey($variable);
            }
        }
    });
});
