<?php

/* Template Name: Front Page
 */

get_header(); ?>

<div class="row">
    <div class="medium-10 columns medium-centered opening-statement">
        <?php echo '<h1>' . get_field('opening_statement_title') . '</h1>'; ?>
        <?php echo '<p>' . get_field('opening_statement_description') . '</p>'; ?>
    </div>
</div>

<div class="demographic-landing-container row medium-up-3">
    <?php
        
        $demographics = get_posts('post_type=user-demographic');
        foreach ($demographics as $demographic) {
            echo '<div class="column">';
            echo '<a href="' . get_permalink($demographic->ID) . '">For ' . $demographic->post_title . '</a>';
            echo '</div>';
        }
    
    ?>
</div>



<div class="full-width-video">
    
    <?php 
    $image = get_field('fwvm_video_preview');
    $size = 'header-image';
    
    echo wp_get_attachment_image( $image['ID'], $size );
    ?>
    
    <div class="full-width-video-content vertical-align-absolute">
        <h3><?php echo get_field('fwvm_video_title'); ?></h3>
        <p><?php echo get_field('fwvm_video_description'); ?></p>
        <a data-open="fullScreenVideo"><i class="fa fa-play-circle"></i></a>
    </div>
    
</div>
<div class="reveal full full-screen-video-reveal" id="fullScreenVideo" data-reveal data-full-screen data-reset-on-close=true>
    
        <div class="video-container">
  
          <video id="video" width="1280" height="720">
            <source src="http://localhost:8888/100foldstudio.org/wp-content/uploads/2015/09/homepage_walking_through_dadeldhura.mov" type="video/mp4">
          </video>
        </div>
    
        <button class="close-button" data-close aria-label="Close modal" type="button">
    <span aria-hidden="true">Close Video &times;</span>
  </button>
</div>

<script>
    $(document).on('closed.zf.reveal', '[data-reveal]', function () {
        var video = document.getElementById('video');
        video.pause();
    });
    $(document).on('open.zf.reveal', '[data-reveal]', function () {
        var video = document.getElementById('video');
        video.play();
    }); 
</script>


<div id="about" class="row our-method-container" data-magellan-target="about">
    <div class="medium-10 columns medium-centered">    
    <h3>Our Method</h3>
        
        <div class="row">
            <div class="medium-4 columns">
                <h4>Train</h4>
                <div class="method-callout">60</div>
                <div class="method-description">Young Architects and Professionals from over 30 Universities.</div>
            </div>
            <div class="medium-4 columns">
                <h4>Equip</h4>
                <div class="method-callout">60</div>
                <div class="method-description">Young Architects and Professionals from over 30 Universities.</div>
            </div>
            <div class="medium-4 columns">
                <h4>Send</h4>
                <div class="method-callout">60</div>
                <div class="method-description">Young Architects and Professionals from over 30 Universities.</div>
            </div>
        </div>
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



<div class="row demographic-last-call">
    <div class="medium-10 columns medium-centered">
        <h3>How can we help you invest your talent?</h3>
        
        <div class="row">
        <?php
        $demographics = get_posts('post_type=user-demographic');
        $num_demographics = count($demographics);
        
        $column_width = 12/$num_demographics;
        
        foreach($demographics as $demographic) {
            echo '<div class="medium-' . $column_width . ' columns">';
            echo '<a href="' . get_permalink($demographic->ID) . '" class="button expanded">';
                echo get_the_title($demographic->ID);
            echo '</a>';
            echo '</div>';
        }
        ?>
        </div>
        
    </div>
</div>

<div class="row project-description">
    <div class="columns medium-8">
        <h2><?php echo get_field( 'our_projects_section_title' ); ?></h2>
        <p><?php echo get_field( 'our_projects_section_description' ); ?></p>
    </div>
    
    <div class="columns medium-4" style="margin-top: 70px;">
        <a href="<?php echo get_field( 'our_projects_section_top_link_url' ); ?>" class="button hollow expanded"><?php echo get_field( 'our_projects_section_top_link_text' ); ?></a>
        <a href="<?php echo get_field( 'our_projects_section_bottom_link_url' ); ?>" class="button expanded"><?php echo get_field( 'our_projects_section_bottom_link_text' ); ?></a>
    </div>
</div>


<?php get_footer(); ?>