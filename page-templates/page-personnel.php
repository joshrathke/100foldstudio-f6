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
    
    
    <?php 
    // check if the repeater field has rows of data
    if( have_rows('list_personnel_based_on_status') ):

        echo '<div class="row">';
        echo '<ul id="og-grid" class="og-grid">';

        // loop through the rows of data
        while ( have_rows('list_personnel_based_on_status') ) : the_row();
        // display a sub field value
        $personnel_status = get_sub_field('related_status');
        $personnel_status_object = get_term($personnel_status);
        
        echo "<li class='personnel-status-title'><h2>{$personnel_status_object->name}</h2></li>";
    
            // display a sub field value
            $personnel_status = get_sub_field('related_status');
            $personnel_status_object = get_term($personnel_status);
    
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
                    $display_name = $coauthor_object[0]->display_name;
                    $author_bio = $coauthor_object[0]->description;
                    $full_image_url = wp_get_attachment_image_src( get_post_thumbnail_id($guest_author->ID), 'large' )[0];
                    $thumb_image_url = wp_get_attachment_image_src( get_post_thumbnail_id($guest_author->ID), 'medium' )[0];

                    echo "<li>";
                        echo "<a href='#_' data-largesrc='{$full_image_url}' data-title='{$display_name}' data-description='{$author_bio}'>";
                            echo "<img src='{$thumb_image_url}' />";
                        echo "</a>"; ?>

                        <?php
                    echo "</li>";
                }
                wp_reset_postdata();
            } else {
                // no posts found
            }
        endwhile;

        echo '</ul';
        echo '</div>';
        echo '</div>';

    else :

        // no rows found

    endif;
    ?>
        
    <script src="<?php echo get_bloginfo('template_directory'); ?>/assets/javascript/personnel-modernizr.js"></script>
    <script src="<?php echo get_bloginfo('template_directory'); ?>/assets/javascript/personnel-list.js"></script>
    <script>
    $(document).ready(function() {
        $(function() {
            Grid.init();
        });
    });
    </script>


</div>

<?php endwhile; else : ?>
	<p><?php _e( 'Sorry, no posts matched your criteria.' ); ?></p>
<?php endif; ?>
<?php get_footer(); ?>