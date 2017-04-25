<?php


	// If a feature image is set, get the id, so it can be injected as a css background property
	if ( has_post_thumbnail( $post->ID ) ) :
		$image = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'header-image' );
		$image = $image[0];
		?>

	<header id="featured-hero" role="banner" style="background-image: url('<?php echo $image ?>')">
        
        <?php
        if (get_post_type() == 'user-demographic') : ?>
        
            <div class="column row user-demographic-header-content vertical-align-relative">
                <h1><?php the_title(); ?></h1>
                <?php // Display Action Buttons
                if( have_rows('action_buttons') ):
                    while ( have_rows('action_buttons') ) : the_row();

                        echo '<a href="' . get_sub_field('button_url') . '" class="button hollow">';
                        the_sub_field('button_text');
                        echo '</a>';

                    endwhile;
                endif; ?>
            </div>
            
        <?php endif ?>



        <?php
        // Switch for header content type
        switch (get_field('fih_header_content_type')) {
            
            // If header content is a form
            case 'Form':
                // Get Form ID
                $form_id = get_field('fih_header_content_form');
                echo '<div class="row fih-form-container">';
                    echo '<div class="large-7 columns">';
                        echo '<h1>' . get_the_title() . '</h1>';
                        echo '<p>'. get_field('fih_header_content_description') . '</p>';
                    echo '</div>';
                    echo '<div class="large-5 columns">';
                        echo do_shortcode("[gravityform id='{$form_id}' title='true' description='false' ajax='true']");
                    echo '</div>';
                echo '</div>';
                break;

            
            // Title & Action header content
            case 'Action':
                echo '<div class="column row user-demographic-header-content vertical-align-relative">';
                    echo '<h1>' . get_field('fih_header_content_title') . '</h1>';
                    
                    // Display Action Buttons
                    if( have_rows('fih_header_content_actions') ):
                        while ( have_rows('fih_header_content_actions') ) : the_row();

                            echo '<a href="' . get_sub_field('button_action') . '" class="button hollow">';
                            the_sub_field('button_title');
                            echo '</a>';

                        endwhile;
                    endif;
                echo '</div>';
                break;
                
        }



        ?>

        
	</header>
	<?php endif;
