<?php

/**
 *  Personnel Page
 *  This page represents the template used for the any page used
 *  to display a group of people.
 *
 *  Template Name: Personnel List
 */

get_header();

// Pull in featured image.
get_template_part( 'template-parts/featured-image' ); 

// Start the Loop
if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>

<div class="personnel-list row">
    
    <div class="medium-12 columns">
        <?php the_content(); ?>
    </div>


</div>

<?php endwhile; else : ?>
	<p><?php _e( 'Sorry, no posts matched your criteria.' ); ?></p>
<?php endif; ?>
<?php get_footer(); ?>