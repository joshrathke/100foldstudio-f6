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
    
    
    <?php 
    // check if the repeater field has rows of data
    if( have_rows('personnel_status_sort_order', 'option') ):
    
        // loop through the rows of data
        while ( have_rows('personnel_status_sort_order', 'option') ) : the_row();
            echo '<div id="personnel-profile-grid" class="personnel-profile-grid medium-up-4 small-up-3">';
    
            // display a sub field value
            $personnel_status = get_sub_field('personnel_status');
            $personnel_status_object = get_term($personnel_status);
            
            echo "<h2>{$personnel_status_object->name}</h2>";
    
            $args = array(
            'post_type'   => 'guest-author',
            'numberposts' => -1,
            'tax_query'   => array(
                array(
                'taxonomy' => 'personnel_status_tax',
                'field' => 'id',
                'terms' => $personnel_status
                 )
              )
            );
            $guest_authors = new WP_Query( $args );
    
    
            if ( $guest_authors->have_posts() ) {
                while ( $guest_authors->have_posts() ) {
                    $guest_authors->the_post();
                    
                    // Build Co-Author Object
                    $coauthor_object = get_coauthors($post->ID);

                    // Build Variables for Author Profile
                    $display_name = $guest_author->post_title;
                    $author_bio = $coauthor_object[0]->description;
                    $full_image_url = wp_get_attachment_image_src( get_post_thumbnail_id($guest_author->ID), 'full' )[0];
                    $thumb_image_url = wp_get_attachment_image_src( get_post_thumbnail_id($guest_author->ID), 'medium' )[0];

                    echo "<div class='column'><a href='#_' data-largesrc='{$full_image_url}' data-title='{$display_name}' data-description='{$author_bio}'><img src='{$thumb_image_url}' /></a></div>";
                }
                wp_reset_postdata();
            } else {
                // no posts found
            }
    
        echo '</div>';
        endwhile;

    else :

        // no rows found

    endif;
    ?>
        
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