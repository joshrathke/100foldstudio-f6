<?php
/**
 * Register theme support for languages, menus, post-thumbnails, post-formats etc.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

if ( ! function_exists( 'foundationpress_theme_support' ) ) :
function foundationpress_theme_support() {
	// Add language support
	load_theme_textdomain( 'foundationpress', get_template_directory() . '/languages' );

	// Switch default core markup for search form, comment form, and comments to output valid HTML5
	add_theme_support( 'html5', array(
		'search-form',
		'comment-form',
		'comment-list',
		'gallery',
		'caption',
	) );

	// Add menu support
	add_theme_support( 'menus' );

	// Let WordPress manage the document title
	add_theme_support( 'title-tag' );

	// Add post thumbnail support: http://codex.wordpress.org/Post_Thumbnails
	add_theme_support( 'post-thumbnails' );
    
    // Add Custom Thumbnail Sizes
    if ( function_exists( 'add_image_size' ) ) {
        add_image_size( 'project-full-size', 2560, 1440, true); // 16:9 Ratio
        add_image_size( 'project-thumbnail', 640, 360, true); // 16:9 Ratio
        add_image_size( 'header-image', 2000, 800, true ); // 2.5:1 Ratio
        add_image_size( 'header-thumbnail', 500, 200, true); // 2.5:1 Ratio
        add_image_size( 'bar-image', 1200, 438, true ); // 2.75:1 Ratio
    }
    
    // Add Custom Thumbnail Sizes to "Add Media" Modal
    add_filter('image_size_names_choose', 'custom_image_sizes_choose');
    function custom_image_sizes_choose($sizes) {
        $custom_sizes = array(
            "header-image"  => __( "Header Image (2.5:1)" ),
            "bar-image"     => __( "Bar Image (2.75:1)" ),
        );
        return array_merge($sizes, $custom_sizes);
    }

	// Remove Content Editor on certain page templates
	add_action( 'admin_head', 'hide_editor' );
	function hide_editor() {
		// Get the Post ID.
		$post_id = $_GET['post'] ? $_GET['post'] : $_POST['post_ID'] ;
		if( !isset( $post_id ) ) return;

		// Hide the editor on a page with a specific page template
		// Get the name of the Page Template file.
		$template_file = substr( get_page_template(), strrpos( get_page_template(), '/' ) + 1 );
		if($template_file == 'page-pray-with-us.php'){ // the filename of the page template
			remove_post_type_support('page', 'editor');
		}
	}

	// Remove Authors from pages
	function hide_author_on_pages() {
		remove_meta_box( 'commentsdiv', 'page', 'normal' );
		remove_meta_box( 'commentstatusdiv', 'page', 'normal' );
	}
	add_action( 'admin_menu', 'hide_author_on_pages' );

	// RSS thingy
	add_theme_support( 'automatic-feed-links' );

	// Add post formarts support: http://codex.wordpress.org/Post_Formats
	add_theme_support( 'post-formats', array('aside', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio', 'chat') );

	// Declare WooCommerce support per http://docs.woothemes.com/document/third-party-custom-theme-compatibility/
	add_theme_support( 'woocommerce' );
}

add_action( 'after_setup_theme', 'foundationpress_theme_support' );
endif;
