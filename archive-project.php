<?php 

/**
 *  Project Archive Template
 *  This is the template used to display
 *  all of the projects.
 *
 *  Template Name: Project Archive
 */

get_header(); ?>

<?php

// check if the repeater field has rows of data
if( have_rows('project_classification_order', 'option') ):
    while ( have_rows('project_classification_order', 'option') ) : the_row();
        
        // Display Project Classification Description if Available
        if (get_sub_field( 'project_classification_description' )) {
            echo '<div class="column row">';
            echo get_sub_field( 'project_classification_description' );
            echo '</div>';
        }

        // Start Block Grid
        echo '<div class="row medium-up-4">';
        
        // Define Project Classification Object
        $project_classification = get_sub_field('project_classification');

        // Query Projects in Particular Project Classificaiton
        $the_query = new WP_Query( array (
            'post_type' => 'project',
            'project_classification' => $project_classification->slug,
        ));

        // Display Each Project
        if ( $the_query->have_posts() ) {
            while ( $the_query->have_posts() ) {
                $the_query->the_post();
                
                echo '<div class="column">';
                echo get_the_post_thumbnail($post, 'header-thumbnail');
                echo get_the_title();
                echo '</div>';
            }
        } else {
            // no posts found
        }
        /* Restore original Post Data */
        wp_reset_postdata();
        
        // Close Block Grid
        echo '</div>';

    endwhile; else : endif; ?>

<?php get_footer(); ?>