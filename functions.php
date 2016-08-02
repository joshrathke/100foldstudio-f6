<?php
/**
 * Author: Ole Fredrik Lie
 * URL: http://olefredrik.com
 *
 * FoundationPress functions and definitions
 *
 * Set up the theme and provides some helper functions, which are used in the
 * theme as custom template tags. Others are attached to action and filter
 * hooks in WordPress to change core functionality.
 *
 * @link https://codex.wordpress.org/Theme_Development
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

/** Various clean up functions */
require_once( 'library/cleanup.php' );

/** Required for Foundation to work properly */
require_once( 'library/foundation.php' );

/** Register all navigation menus */
require_once( 'library/navigation.php' );

/** Add menu walkers for top-bar and off-canvas */
require_once( 'library/menu-walkers.php' );

/** Create widget areas in sidebar and footer */
require_once( 'library/widget-areas.php' );

/** Return entry meta information for posts */
require_once( 'library/entry-meta.php' );

/** Enqueue scripts */
require_once( 'library/enqueue-scripts.php' );

/** Add theme support */
require_once( 'library/theme-support.php' );

/** Add Nav Options to Customer */
require_once( 'library/custom-nav.php' );

/** Change WP's sticky post class */
require_once( 'library/sticky-posts.php' );

/** Configure responsive image sizes */
require_once( 'library/responsive-images.php' );

/**
 *  Register Editor Shortcodes
 *  This registers all of the shortcodes included in the
 *  editor-shortcodes folder.
 */
require_once( 'library/editor-shortcodes/shortcodes-settings.php' );


/**
 *  Register Custom Post Types
 *  This section registers all of the custom post types we need,
 *  along with all of their functions.
 */
require_once( 'library/custom_post_types/project_cpt.php');

/**
 *  Register Custom Taxonomies
 *  This section registers all of the custom taxonomies we use
 *  for the theme along with any functions they require.
 */
require_once( 'library/custom_taxonomies/project_classification_tax.php' ); // Project Classification
require_once( 'library/custom_taxonomies/project_region_tax.php' ); // Project Continent
require_once( 'library/custom_taxonomies/project_country_tax.php' ); // Project Country

/**
 *  Register Options Page
 *  This registers the Theme options page using the Advanced
 *  Custom Fields plugin.
 */

if( function_exists('acf_add_options_page') ) {
	
	acf_add_options_page(array(
		'page_title' 	=> 'Theme Settings',
		'menu_title'	=> 'Theme Settings',
		'menu_slug' 	=> 'theme-settings',
        'icon_url'      => 'dashicons-forms',
		'capability'	=> 'edit_posts',
		'redirect'		=> false
	));
	
	acf_add_options_sub_page(array(
		'page_title' 	=> 'Social Media Settings',
		'menu_title'	=> 'Social Media',
		'parent_slug'	=> 'theme-settings',
	));
    
    acf_add_options_sub_page(array(
		'page_title' 	=> 'Project Settings',
		'menu_title'	=> 'Projects',
		'parent_slug'	=> 'theme-settings',
	));
	
}

/*	Function Get Excerpt By ID
 *	This function allows us to get the excerpt of a
 *	post by the ID of the post, and also allows a
 *	word count to be passed to allow for excerpt length
 *	variability.
 */
function get_excerpt_by_id( $post_id, $excerpt_length = 40, $echo_link = false, $link_text = ' [Read More...]' )
{
	$the_post = get_post( $post_id ); //Gets post ID
	$the_permalink = get_permalink( $post_id );
	$the_excerpt = $the_post->post_content; //Gets post_content to be used as a basis for the excerpt
	$the_excerpt = strip_tags( strip_shortcodes( $the_excerpt ) ); //Strips tags and images
	$words = explode( ' ', $the_excerpt, $excerpt_length + 1 );
	if ( count( $words ) > $excerpt_length ) :
		array_pop( $words );
		//array_push( $words, '[…]' );
		$the_excerpt = implode( ' ', $words );
		if ( $echo_link ) {
			$the_excerpt .= "<a href='{$the_permalink}'>{$link_text}</a>";
		}
	endif;
	$the_excerpt = '<p>' . $the_excerpt . '</p>';
	return $the_excerpt;
}

?>