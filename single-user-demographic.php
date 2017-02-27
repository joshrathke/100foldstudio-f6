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

// check if the repeater field has rows of data
if( have_rows('client') ):
    
    // Count number of clients
    $clients = count(get_field('client'));
    $current_client = 1;

    // Assign Column Width Based on Clients
    $column_width = $clients <= 6 ? 2 : 1;
    $row_offset = (12 - ($column_width * $clients))/2;

    echo '<div class="notable-clients-bar">';
    echo '<div class="row" data-equalizer data-equalize-on="medium">';

 	// loop through the rows of data
    while ( have_rows('client') ) : the_row();

        $client_url = get_sub_field('client_url');
        $offset = $current_client == 1 ? 'medium-offset-' . $row_offset : '';
        $last_client = $clients == $current_client ? true : false;
        $last_column = $last_client ? 'end' : '';
        
        echo '<div class="medium-2 columns ' . $last_column . ' ' . $offset . '" data-equalizer-watch>';
            echo "<a href='{$client_url}'>";
                $logo = get_sub_field('client_logo');
                echo  '<img src="' . $logo['url'] . '" class="vertical-align-relative" />';
            echo '</a>';
        echo '</div>';

    $current_client++;

    endwhile;
    echo '</div>';
    echo '</div>';

else :

    // no rows found

endif;
?>

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

<div class="row">
    <div class="medium-8 columns small-centered">
        <?php read_more_content(get_the_content()); ?>
    </div>
</div>



<div class="orbit" role="region" aria-label="Projects" data-orbit>
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
        
        $step_number = 1;
        
        echo '<h3>Action Plan<a class="button accordion-expand-all" href="#_">Expand All</a></h3>';
        echo '<ul id="action-plan" class="accordion clearfix" data-accordion data-multi-expand="true">';
        while ( have_rows('action_plan') ) : the_row(); ?>

              <li class="accordion-item <?php echo $step_number == 1 ? 'is-active' : ''; ?>" data-accordion-item>
                <a href="#_" class="accordion-title"><?php echo get_sub_field('step_title') ?></a>
                <div class="accordion-content" data-tab-content>
                  <?php echo get_sub_field('step_description'); ?>
                </div>
              </li>
        
        <?php 
        $step_number++;
        endwhile;
        echo '</ul>';
    endif; ?>
    </div>
</div>


<div class="row">
    <div class="medium-8 columns medium-centered columns">
    <h3>Get More Information</h3>
    <?php echo do_shortcode('[gravityform id="16" title="false" description="false"]'); ?>
    </div>
</div>

<?php 

// End Loop
endwhile; else : endif;

get_footer(); ?>
