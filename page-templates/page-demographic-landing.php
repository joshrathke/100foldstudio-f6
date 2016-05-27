<?php

/**
 *  User Demographic Landing Page
 *  This page represents the template used for the landing page for different user
 *  demographics throughout the site.
 *
 *  Template Name: Demographic Landing
 */

get_header();

// Pull in featured image.
get_template_part( 'template-parts/featured-image' ); 

// Start the Loop
if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>

<div class="demographic-landing row">
    
    <div class="medium-12 columns">
        <?php the_content(); ?>
    </div>


</div>

<?php endwhile; else : ?>
	<p><?php _e( 'Sorry, no posts matched your criteria.' ); ?></p>
<?php endif; ?>
<?php get_footer(); ?>