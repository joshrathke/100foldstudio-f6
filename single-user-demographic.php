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

<div class="row">
    <div class="medium-8 columns small-centered">
        <div class="quote">
            <?php echo get_field('impact_quote'); ?>
            <div class="quote-author">- Joe Blogz - Founder of Lakeside</div>
        </div>
        
        <div class="impact_quote_actions">
        <?php while ( have_rows('impact_quote_actions') ) : the_row(); ?>

            <a href="#" class="button hollow"><?php echo get_sub_field('button_text') ?></a>
        
        <?php endwhile; ?>
        </div>
    </div>
</div>


<div class="row demographic-project-container">
    <div class="medium-10 small-centered columns">
        
        <?php // Start Block Grid
        echo '<div class="row medium-up-4">';

        // Query Projects in Particular Project Classificaiton
        $the_query = new WP_Query( array (
            'post_type' => 'project',
            'posts_per_page' => 4,
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
        echo '</div>'; ?>
    </div>
</div>

<div class="orbit" role="region" aria-label="Favorite Space Pictures" data-orbit>
  <ul class="orbit-container">
    <button class="orbit-previous"><span class="show-for-sr">Previous Slide</span>&#9664;&#xFE0E;</button>
    <button class="orbit-next"><span class="show-for-sr">Next Slide</span>&#9654;&#xFE0E;</button>
    
      
      <?php
      
        // check if the repeater field has rows of data
        if( have_rows('slides') ):
        $slide_index = 0;
            // loop through the rows of data
            while ( have_rows('slides') ) : the_row(); ?>
                <li class="orbit-slide">
                  <img class="orbit-image" src="<?php echo get_sub_field('slide_image')['sizes']['header-image']; ?>" alt="Space">
                    <div class="slide-content row">
                        <div class="small-10 small-centered columns">
                            <h6><?php echo get_sub_field('slide_description'); ?></h6>
                        </div>
                    </div>
                </li>
            
            <?php
            // Increment Slide Index
            $slide_index++;
            endwhile;

        else :

            // no rows found

        endif;
      
      ?>
  </ul>
  <nav class="orbit-bullets column row">
      
      <?php
      
        // check if the repeater field has rows of data
        if( have_rows('slides') ):
        $slide_index = 0;
            // loop through the rows of data
            while ( have_rows('slides') ) : the_row(); ?>
                <button data-slide="<?php echo $slide_index; ?>" class="<?php echo $slide_index == 0 ? 'is-active' : null; ?>">
                    <img src="<?php echo get_sub_field('slide_image')['sizes']['thumbnail']; ?>" />
                </button>
      
            <?php
            // Increment Slide Index
            $slide_index++;
            endwhile;

        else :

            // no rows found

        endif;
      
      ?>
  </nav>
</div>


<div class="row action-plan-container">
    <div class="medium-8 small-centered columns">
    <?php // Display Action Buttons
    if( have_rows('action_plan') ):
        echo '<h3>Action Plan</h3>';
        echo '<ul class="accordion clearfix" data-accordion>';
        while ( have_rows('action_plan') ) : the_row(); ?>

              <li class="accordion-item" data-accordion-item>
                <a href="#" class="accordion-title"><?php echo get_sub_field('step_title') ?></a>
                <div class="accordion-content" data-tab-content>
                  <?php echo get_sub_field('step_description'); ?>
                </div>
              </li>
        
        <?php endwhile;
        echo '</ul>';
    endif; ?>
    </div>
</div>


<?php 

// End Loop
endwhile; else : endif;

get_footer(); ?>
