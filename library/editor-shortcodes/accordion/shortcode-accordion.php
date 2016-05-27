<?php
/**
 * Add Accordion Shortcode to WYSIWYG Editor
 * This will add a button to the wysiwyg editor that allows
 * the end user to create a foundation grid within their post's
 * content.
 *
 * @package WordPress
 * @subpackage FoundationPress
 */

/**
 *  Render Foundation Accordion
 *  This renders the wrapper and all of the attributes
 *  for a foundation accordion container element.
 */
function render_foundation_accordion( $atts, $content = '' ) {
    
    // Normalize Attributes to Identify Unnamed Attributes
    $atts = normalize_attributes($atts);
    
    // Declare Acceptable Attributes
    $atts = shortcode_atts(array(
        'multi-expand' => 0,
        'all-closed'   => 0,
    ), $atts);
    
    // Accordion Attributes
    $multi_expand = $atts['multi-expand'] ? 'data-multi-expand="true"' : null; // Multi Expand
    $all_closed = $atts['all-closed'] ? 'data-allow-all-closed="true"' : null; // All Closed
    
    return do_shortcode( "<ul class='accordion' data-accordion {$multi_expand} {$all_closed}>" . $content . "</ul>" );
}
add_shortcode( 'fdn-acdn', 'render_foundation_accordion' );

/**
 *  Render Foundation Accordion Item
 *  This renders each item for a foundation based
 *  accordion container element.
 */
function render_foundation_accordion_item ( $atts, $content = '' ) {
    
    // Normalize Attributes to Identify Unnamed Attributes
    $atts = normalize_attributes($atts);
    
    // Declare Acceptable Attributes
    $atts = shortcode_atts(array(
        'is-active' => 0,
    ), $atts);
    
    // Accordion Item Attributes
    $is_active = $atts['is-active'] ? 'is-active' : null; 
    
    return do_shortcode("<li class='accordion-item {$is_active}' data-accordion-item>" . $content . "</li>");
}
add_shortcode( 'fdn-acdn-item', 'render_foundation_accordion_item' );

/**
 *  Render Foundation Accordion Item Title
 *  This renders each item title for a foundation based
 *  accordion container element.
 */
function render_foundation_accordion_item_title ( $atts, $content = '' ) {
    
    return do_shortcode("<a href='#' class='accordion-title''>" . $content . "</a>");
}
add_shortcode( 'fdn-acdn-title', 'render_foundation_accordion_item_title' );

/**
 *  Render Foundation Accordion Item Content
 *  This renders each item content for a foundation based
 *  accordion container element.
 */
function render_foundation_accordion_item_content ( $atts, $content = '' ) {
    
    return do_shortcode("<div class='accordion-content' data-tab-content>" . $content . "</div>");
}
add_shortcode( 'fdn-acdn-content', 'render_foundation_accordion_item_content' );



