<?php

/**
 *  Pray With Us
 *  This page represents the template used for prayer requests.
 *
 *  Template Name: Pray With Us
 */

// Include WP Header
get_header();

// Pull in featured image.
get_template_part( 'template-parts/featured-image' );

// Check for prayer requests
if( have_rows('pwu_prayer_requests') ) {

    // Install block grid
    echo '<div class="row medium-up-3">';

    // If prayer requests exist, install them.
    while ( have_rows('pwu_prayer_requests') ) : the_row();
        
        // Display the prayer request
        echo '<div class="column">';
        echo '<h6>' . get_sub_field('pwu_prayer_request_title') . '</h6>';
        echo the_sub_field('pwu_prayer_request_description');
        echo '</div>';

    endwhile;

    // Close block grid
    echo '</div>';

} else {
    // No Prayer Requests Found
}



// Include WP Footer
get_footer();