<?php

namespace Tests\Unit;

use App\Http\Controllers\Frontend\PageController;
use App\Models\pages\Blog;
use App\Services\ContentService;
use PHPUnit\Framework\Attributes\Test;
use ReflectionMethod;
use Tests\TestCase;

class PageControllerTest extends TestCase
{
    #[Test]
    public function it_normalizes_blog_detail_payload_for_the_frontend(): void
    {
        $controller = new PageController(app(ContentService::class));
        $blog = new Blog([
            'slug' => 'test-blog',
            'title' => 'Test Blog',
            'excerpt' => 'Test excerpt',
            'full_content' => '<p>Body content</p>',
            'image' => 'images/blog.jpg',
            'date' => '2024-01-01',
            'author' => 'Jane Doe',
            'read_time' => '5 min read',
            'tags' => ['news'],
            'is_featured' => true,
            'is_active' => true,
        ]);

        $method = new ReflectionMethod(PageController::class, 'normalizeBlogDetail');
        $method->setAccessible(true);

        $normalized = $method->invoke($controller, $blog);

        $this->assertSame('<p>Body content</p>', $normalized['fullContent']);
        $this->assertSame('Jane Doe', $normalized['createdBy']);
        $this->assertSame('5 min read', $normalized['timerRead']);
            $this->assertSame(['news'], $normalized['tags']);
    }

    #[Test]
    public function it_limits_related_blogs_to_three_non_current_items(): void
    {
        $controller = new PageController(app(ContentService::class));
        $blogs = [
            ['id' => 1, 'slug' => 'current', 'title' => 'Current', 'is_featured' => false],
            ['id' => 2, 'slug' => 'related-1', 'title' => 'Related 1', 'is_featured' => false],
            ['id' => 3, 'slug' => 'related-2', 'title' => 'Related 2', 'is_featured' => false],
            ['id' => 4, 'slug' => 'related-3', 'title' => 'Related 3', 'is_featured' => false],
            ['id' => 5, 'slug' => 'related-4', 'title' => 'Related 4', 'is_featured' => false],
            ['id' => 6, 'slug' => 'featured', 'title' => 'Featured', 'is_featured' => true],
        ];

        $method = new ReflectionMethod(PageController::class, 'filterRelatedBlogs');
        $method->setAccessible(true);

        $filtered = $method->invoke($controller, $blogs, ['id' => 1, 'slug' => 'current']);

        $this->assertCount(3, $filtered);
        $this->assertSame([2, 3, 4], array_column($filtered, 'id'));
    }
}
