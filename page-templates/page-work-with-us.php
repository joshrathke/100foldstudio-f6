<?php

/**
 *  Work With Us
 *  This page represents the template used for prayer requests.
 *
 *  Template Name: Work With Us
 */

// Include WP Header
get_header();

// Pull in featured image.
get_template_part( 'template-parts/featured-image' ); 

// Start WP Loop
while ( have_posts() ) : the_post(); ?>

<div class="row">
    <div class="large-10 columns large-centered">
        <h1><?php the_title(); ?></h1>
        <?php the_content(); ?>
    </div>
</div>


<?php // End WP Loop
endwhile;

// Include WP Footer
get_footer();