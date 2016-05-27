<?php
/**
 * Add Button Shortcode to WYSIWYG Editor
 * This will add a button to the wysiwyg editor that allows
 * the end user to create a foundation grid within their post's
 * content.
 *
 * @package WordPress
 * @subpackage FoundationPress
 */

// Render Foundation Columns
function render_foundation_button( $atts, $content = '' ) {

    // Normalize Attributes to Identify Unnamed Attributes
    $atts = normalize_attributes($atts);
    
    // Define Arrays
    

    // Declare Acceptable Attributes
    $atts = shortcode_atts(array(
        'text'      => '',
        'color'     => '',
        'class'     => '',
        'expanded'  => 0,
        'hollow'    => 0,
        'width'     => '',
    ), $atts);

    // Define Column Widths
    $atts['width'] ? $button_styles[] = 'width: ' . $atts['width'] . ';' : null;
    
    // Class
    $atts['color'] ? $button_classes    .= $atts['color'] : null; // Color
    $atts['class'] ? $button_classes    .= ' ' . $atts['class'] : null; // Class
    $atts['expanded'] ? $button_classes .= ' expanded' : null; // Expanded
    $atts['hollow'] ? $button_classes   .= ' hollow' : null; // Hollow

    // Turn Arrays into String for HTML
    $button_style = isset($button_styles) ? implode( ' ', $button_styles ) : null;

    return do_shortcode( "<a class='button {$button_classes}' style='{$button_style}'>" . $atts['text'] . '</a>' );
}
add_shortcode( 'fdn-btn', 'render_foundation_button' );