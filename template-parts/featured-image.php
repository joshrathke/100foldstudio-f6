<?php


	// If a feature image is set, get the id, so it can be injected as a css background property
	if ( has_post_thumbnail( $post->ID ) ) :
		$image = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'single-post-thumbnail' );
		$image = $image[0];
		?>

	<header id="featured-hero" role="banner" style="background-image: url('<?php echo $image ?>')">
        
        <?php
        if (get_post_type() == 'user-demographic') : ?>
        
            <div class="column row user-demographic-header-content vertical-align-relative">
                <h1><?php the_title(); ?></h1>
                <a class="button hollow">Start A Project</a>
                <a class="button hollow">Watch A Video</a>
            </div>
            
        <?php endif ?>
        
	</header>
	<?php endif;
