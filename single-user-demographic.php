<?php

/**
 *  Single Project Template
 *  This is the template used for individual project pages.
 */

get_header(); 

// Begin the Loop
if ( have_posts() ) : while ( have_posts() ) : the_post();

// Include Featured Image
get_template_part( 'template-parts/featured-image' ); ?>







<?php 

// End Loop
endwhile; else : endif;

get_footer(); ?>
