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

    <div class="medium-12">
            <h1><?php the_title(); ?></h1>
            <?php the_content(); ?>
    </div>
    
    <?php print_r(get_field('list_personnel_based_on_status')); ?>
    
    <div id="personnel-profile-grid" class="personnel-profile-grid medium-up-4 small-up-3">
        
        <?php // Retrieve All Guest Authors
        $guest_authors = get_posts('post_type=guest-author&numberposts=-1');
        
        foreach ($guest_authors as $guest_author) :
            // Build Co-Author Object
            $coauthor_object = get_coauthors($guest_author->ID);
            
            // Build Variables for Author Profile
            $display_name = $guest_author->post_title;
            $author_bio = $coauthor_object[0]->description;
            $full_image_url = wp_get_attachment_image_src( get_post_thumbnail_id($guest_author->ID), 'full' )[0];
            $thumb_image_url = wp_get_attachment_image_src( get_post_thumbnail_id($guest_author->ID), 'medium' )[0];
        
            echo "<div class='column'><a href='#_' data-largesrc='{$full_image_url}' data-title='{$display_name}' data-description='{$author_bio}'><img src='{$thumb_image_url}' /></a></div>";
        endforeach;
        ?>
    </div>
        
    <script src="<?php echo get_bloginfo('template_directory'); ?>/assets/javascript/personnel-modernizr.js"></script>
    <script src="<?php echo get_bloginfo('template_directory'); ?>/assets/javascript/personnel-list.js"></script>
    <script>
        $(function() {
            Grid.init();
        });
    </script>


</div>

<?php endwhile; else : ?>
	<p><?php _e( 'Sorry, no posts matched your criteria.' ); ?></p>
<?php endif; ?>
<?php get_footer(); ?>