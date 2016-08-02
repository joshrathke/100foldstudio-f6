<?php

/* Template Name: Front Page
 */

get_header(); ?>

<div class="fsv-container">
    <div class="full-screen-video">

        <div class="fsv-content-container" data-magellan>
            <img src="<?php echo get_bloginfo('template_url'); ?>/assets/images/100foldstudio_logo_thick.png" />
            <?php echo get_field('header_tagline'); ?>
            <a href="#<?php echo get_field( 'header_link_destination' ); ?>" >Learn More</a>
        </div>
        
        <video autoplay loop muted>
          <source src="http://localhost:8888/100foldstudio.org/wp-content/uploads/2015/09/homepage_walking_through_dadeldhura.mov" type="video/mp4">
          <source src="movie.ogg" type="video/ogg">
        Your browser does not support the video tag.
        </video>
    </div>
</div>

<div class="row">
    <div class="medium-10 columns medium-centered opening-statement">
        <?php echo '<h1>' . get_field('opening_statement_title') . '</h1>'; ?>
        <?php echo '<p>' . get_field('opening_statement_description') . '</p>'; ?>
    </div>
</div>

<div class="whats-new">
    <div class="column row">
        <?php echo '<h2>' . get_field('whats_new_section_title') . '</h2>'; ?>
    </div>

        <?php 
        if( have_rows('whats_new_sections') ):
            echo '<div class="row medium-up-3" data-equalizer data-equalize-on="medium">';
            // loop through the rows of data
            while ( have_rows('whats_new_sections') ) : the_row();

                // Define Variables
                $post_id = get_sub_field('page_or_post_to_display');
                $post_title = get_sub_field('section_title');
                $link_text = get_sub_field('section_link_text') ? get_sub_field('section_link_text') : 'Read More';
                $link_url = get_sub_field('section_link_url') ? get_sub_field('section_link_url') : get_permalink($post_id);
                $post_image = get_sub_field('section_header_image') ? get_sub_field('section_header_image') : 
                    wp_get_attachment_image_src(get_post_thumbnail_id($post_id), 'header-thumbnail')[0];

                echo '<div class="column section-container" data-equalizer-watch>';

                echo "<a href='{$link_url}'><img src='{$post_image}' /></a>";
                echo $post_title ? "<a href='{$link_url}'><h4>" . $post_title . '</h4></a>' : 
                        "<a href='{$link_url}'><h4>" . get_the_title($post_id) . '</h4></a>';
                echo get_sub_field('section_description') ? get_sub_field('section_description') : get_excerpt_by_id($post_id, 40, true);
                echo "<a class='button hollow secondary' href='{$link_url}'>{$link_text}</a>";

                echo '</div>';
            endwhile; else : 
            echo '</div>';
        endif; ?>

    </div>
</div>

<div id="about" class="row front-page-content-section" data-magellan-target="about">
    <div class="medium-10 columns medium-centered">
    
    <?php 
    // Loop Through Page and Get Content
    if ( have_posts() ) : while ( have_posts() ) : the_post();
        the_title();
        the_content();
    
    endwhile; else : endif; ?>
    
    </div>
</div>

<div class="full-width-parralax" data-parallax="scroll" data-image-src="<?php echo get_field( 'parallax_section_background_image' ); ?>">
    <div class="row vertical-align-relative"><div class="columns small-12">
        <h2 class="parralax-heading"><?php echo get_field( 'parallax_section_phrase' ); ?></h2>
    </div></div>
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