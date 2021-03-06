<?php

/**
 *  Single Project Template
 *  This is the template used for individual project pages.
 */

get_header(); 

// Begin the Loop
if ( have_posts() ) : while ( have_posts() ) : the_post();

// Get Gallery Images
$gallery_images = get_field('project_images'); ?>

<div class="single-project">

<div class="orbit" role="region" aria-label="Favorite Space Pictures" data-orbit>
  <ul class="orbit-container">
    <button class="orbit-previous"><span class="show-for-sr">Previous Slide</span>&#9664;&#xFE0E;</button>
    <button class="orbit-next"><span class="show-for-sr">Next Slide</span>&#9654;&#xFE0E;</button>
      
    <?php
    $image_counter = 1;
    foreach ($gallery_images as $image)  {
        
        echo $image_counter > 1 ? '<li class="orbit-slide">' : '<li class="is-active orbit-slide">';
            echo "<img class='orbit-image' src='{$image['sizes']['header-image']}' />";
        echo '</li>';
        $image_counter++;
    }
      
    ?>
  </ul>
  <nav class="orbit-bullets">
    <button class="is-active" data-slide="0"><span class="show-for-sr">First slide details.</span><span class="show-for-sr">Current Slide</span></button>
    <button data-slide="1"><span class="show-for-sr">Second slide details.</span></button>
    <button data-slide="2"><span class="show-for-sr">Third slide details.</span></button>
    <button data-slide="3"><span class="show-for-sr">Fourth slide details.</span></button>
  </nav>
</div>










<div class="row">
        <div class="columns medium-12 medium-centered">
            <h1><?php the_title(); ?></h1>
            <h4 class="project-location"><?php echo get_field('project_display_location'); ?></h4>

            <div class="project-info-container">
                <div class="project-info row">
                    <div class="columns medium-2"><h4>Partner:</h4></div>
                    <div class="columns medium-10 project-info-content"><span><?php echo get_field('project_partner'); ?></span></div>
                </div>

                <div class="project-info row">
                    <div class="columns medium-2"><h4>Impact:</h4></div>
                    <div class="columns medium-10 project-info-content"><span><?php echo get_field('project_impact'); ?></span></div>
                </div>

                <div class="project-info row">
                    <div class="columns medium-2"><h4>Status:</h4></div>
                    <div class="columns medium-10 project-info-content"><span><?php echo get_field('project_status'); ?></span></div>
                </div>
            </div>

            <div class="content-section">
                <?php the_content(); ?>
            </div>

            <div class="find-out-more">
                <h3>Find Out More:</h3>
                <?php echo get_field('learn_more_link'); ?>
            </div>
            
            <div class="donate-to-project">
                <p></p>
            </div>

            <div class="back-to-projects">
                <i class="fa fa-angle-left" aria-hidden="true"></i><a href="<?php get_post_type_archive_link( 'project' ); ?>">Back To Projects</a>
            </div>

        </div>
    </div>

    <?php
    $project_country = get_the_terms( $post, 'project_country');
    $project_country_slug = $project_classification[0]->slug;
    $more_projects = new WP_Query( "post_type=project&project_classification={$project_country_slug}&posts_per_page=4" );
    // The Loop
    if ( $more_projects->have_posts() ) {

        echo '<div class="more-projects-container">';
            // Display Title With Related Project Classification
            echo "<div class='column row'><h6>Other {$project_country[0]->name} Projects</h6></div>";

            echo '<div class="row medium-up-4">';

            while ( $more_projects->have_posts() ) {
                $more_projects->the_post();

                    echo '<div class="column">';
                        the_post_thumbnail( 'project-thumbnail' );
                        echo '<h4>' . get_the_title() . '</h4>';

                    echo '</div>';
            }

            echo '</div>';
        echo '</div>';
    } else {
        // No Projects Within The Same Country Found
    }

    wp_reset_postdata(); ?>

</div>

<?php 

// End Loop
endwhile; else : endif;

get_footer(); ?>