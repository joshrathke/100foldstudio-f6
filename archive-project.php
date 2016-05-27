<?php 

/**
 *  Project Archive Template
 *  This is the template used to display
 *  all of the projects.
 */

get_header(); ?>

<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD4qA8LbOKpoFeaT5a_zCTqDVgW4O-gZRY"></script>
<script type="text/javascript" src="<?php echo get_bloginfo( 'template_directory' ); ?>/assets/javascript/infobox.js"></script>

<?php 
// Register the script
wp_register_script( 'project-archive-map', get_bloginfo( 'template_directory' ) . '/assets/javascript/project-archive-map.js' );
// Enqueued script with localized data.
wp_enqueue_script( 'project-archive-map' );
// Localize Script to Store Data in for Javascript
localize_map_data(); 
// Localize site url for use with javascript
wp_localize_script('project-archive-map', 'site_url', array( 'site_url' => get_option('siteurl') ));?>


<div id="projects-map"></div>


<div class="project-archive">

<?php

// check if the repeater field has rows of data
if( have_rows('project_classification_order', 'option') ):
    while ( have_rows('project_classification_order', 'option') ) : the_row();

        // Define Project Classification Object
        $project_classification = get_sub_field('project_classification');
        
        echo '<div class="column row">';
            echo '<h5>' . get_term( $project_classification, 'project_classification')->name . '</h5>';

            // Display Project Classification Description if Available
            if (get_sub_field( 'project_classification_description' )) {
                echo get_sub_field( 'project_classification_description' );
            }
        echo '</div>';

        // Start Block Grid
        echo '<div class="row medium-up-4">';

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
                echo '<a href="' . get_permalink() . '">';
                
                if (has_post_thumbnail($post)) {
                    echo get_the_post_thumbnail($post, 'project-thumbnail');
                } else {
                    echo '<img src="http://placehold.it/640x360">';
                }
                echo '<h4>' . get_the_title() . '</h4>';
                echo '</a>';
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
    
</div>

<?php get_footer(); ?>