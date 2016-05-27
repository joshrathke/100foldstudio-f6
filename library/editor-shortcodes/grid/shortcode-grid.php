<?php
/**
 * Add Grid Shortcode to WYSIWYG Editor
 * This will add a button to the wysiwyg editor that allows
 * the end user to create a foundation grid within their post's
 * content.
 *
 * @package WordPress
 * @subpackage FoundationPress
 */

// Render Foundation Columns
function render_foundation_column( $atts, $content = '' ) {

    // Normalize Attributes to Identify Unnamed Attributes
    $atts = normalize_attributes($atts);

    // Declare Acceptable Attributes
    $atts = shortcode_atts(array(
        'sm'  => '',
        'md'  => '',
        'lg'  => '',
        'sm-off'    => '',
        'md-off'    => '',
        'lg-off'    => '',
        'sm-ctr'    => 0,
        'md-ctr'    => 0,
        'lg-ctr'    => 0,
        'sm-unctr'  => 0,
        'md-unctr'  => 0,
        'lg-unctr'  => 0,
        'sm-pull'   => '',
        'md-pull'   => '',
        'lg-pull'   => '',
        'sm-push'   => '',
        'md-push'   => '',
        'lg-push'   => '',
        'class'     => '',
    ), $atts);

    // Define Column Widths
    $atts['sm'] ? $column_classes[] = 'small-' . $atts['sm'] : null;
    $atts['md'] ? $column_classes[] = 'medium-' . $atts['md'] : null;
    $atts['lg'] ? $column_classes[] = 'large-' . $atts['lg'] : null;

    // Define Column Offsets
    $atts['sm-off'] ? $column_classes[] = 'small-offset-' . $atts['sm-off'] : null;
    $atts['md-off'] ? $column_classes[] = 'medium-offset-' . $atts['md-off'] : null;
    $atts['lg-off'] ? $column_classes[] = 'large-offset-' . $atts['lg-off'] : null;

    // Define Column Center
    $atts['sm-ctr'] ? $column_classes[] = 'small-centered' : null;
    $atts['md-ctr'] ? $column_classes[] = 'medium-centered' : null;
    $atts['lg-ctr'] ? $column_classes[] = 'large-centered' : null;
    $atts['sm-unctr'] ? $column_classes[] = 'small-uncentered' : null;
    $atts['md-unctr'] ? $column_classes[] = 'medium-uncentered' : null;
    $atts['lg-unctr'] ? $column_classes[] = 'large-uncentered' : null;

    // Define Source Odering
    $atts['sm-pull'] ? $column_classes[] = 'small-pull-' . $atts['sm-pull'] : null;
    $atts['md-pull'] ? $column_classes[] = 'medium-pull-' . $atts['md-pull'] : null;
    $atts['lg-pull'] ? $column_classes[] = 'large-pull-' . $atts['lg-pull'] : null;
    $atts['sm-push'] ? $column_classes[] = 'small-push-' . $atts['sm-push'] : null;
    $atts['md-push'] ? $column_classes[] = 'medium-push-' . $atts['md-push'] : null;
    $atts['lg-push'] ? $column_classes[] = 'large-push-' . $atts['lg-push'] : null;

    // Define Additional Classes
    $atts['class'] ? $column_classes[] = $atts['class'] : null;

    // Turn Column Class Array into String for HTML
    $column_class = isset($column_classes) ? implode( ' ', $column_classes ) : null;

    return do_shortcode( "<div class='{$column_class} columns'>" . $content . '</div>' );
}
add_shortcode( 'fdn-col', 'render_foundation_column' );

// Render Foundation Rows
function render_foundation_row( $atts, $content = '' ) {
    return do_shortcode( '<div class="row">' . $content . '</div>' );
}
add_shortcode( 'fdn-row', 'render_foundation_row' );

/**
 *  Remove WP Auto <br /> Tags
 *  Not sure how to fix this yet, but by default wordpress wants to
 *  automatically add <br /> tags at every line break in the editor
 *  which allows the shortcode to be readable. Don't really want to
 *  completely remove a users ability to have a break rather than a
 *  new paragraph but this will work for testing purposes.
 */

remove_filter( 'the_content', 'wpautop' );
remove_filter( 'the_excerpt', 'wpautop' );

function wpse_wpautop_nobr( $content ) {
    return wpautop( $content, false );
}

add_filter( 'the_content', 'wpse_wpautop_nobr' );
add_filter( 'the_excerpt', 'wpse_wpautop_nobr' );
