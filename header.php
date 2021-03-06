<?php
/**
 * The template for displaying the header
 *
 * Displays all of the head element and everything up until the "container" div.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>
<!doctype html>
<html class="no-js" <?php language_attributes(); ?> >
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<?php wp_head(); ?>
	</head>
	<body <?php body_class(); ?>>
	<?php do_action( 'foundationpress_after_body' ); ?>

	<?php if ( get_theme_mod( 'wpt_mobile_menu_layout' ) == 'offcanvas' ) : ?>
	<div class="off-canvas-wrapper">
		<div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>
		<?php get_template_part( 'template-parts/mobile-off-canvas' ); ?>
	<?php endif; ?>

	<?php do_action( 'foundationpress_layout_start' ); ?>

    <div data-sticky-container>
	<header id="masthead" class="site-header sticky" role="banner" data-sticky data-margin-top="0" style="width:100%">
        
        <?php do_action( 'foundationpress_before_title_bar' ); ?>
        
		<div class="title-bar" data-responsive-toggle="site-navigation">
			<button class="menu-icon" type="button" data-toggle="mobile-menu"></button>
			<div class="title-bar-title">
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a>
			</div>
		</div>

		<nav id="site-navigation" class="main-navigation top-bar" role="navigation">
			<div class="top-bar-left">
				<ul class="menu">
					<li class="home">
                        <a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
                            <img src="<?php echo get_template_directory_uri(); ?>/assets/images/gray_on_white_linear.png" />
                        </a>
                    </li>
				</ul>
			</div>
			<div class="top-bar-right">
				<?php foundationpress_top_bar_r(); ?>

				<?php if ( ! get_theme_mod( 'wpt_mobile_menu_layout' ) || get_theme_mod( 'wpt_mobile_menu_layout' ) == 'topbar' ) : ?>
					<?php get_template_part( 'template-parts/mobile-top-bar' ); ?>
				<?php endif; ?>
			</div>
		</nav>
	</header>
    </div>



	<?php
	/*
	*  Insert Front Page Video if Enabled
	*  This section includes the featured video on the front page
	*  if the option has been enabled.
	*/
	
	if (get_field('fsv_enable')) { ?>

	<div class="fsv-container">
		<div class="full-screen-video">

			<div class="fsv-content-container" data-magellan>
				<img src="<?php echo get_bloginfo('template_url'); ?>/assets/images/100foldstudio_logo_thick.png" />
				<?php echo get_field('header_tagline'); ?>
				<a href="#<?php echo get_field( 'header_link_destination' ); ?>">Learn More</a>
			</div>
			
			<?php

			// Retrieve Video File
			$mp4_video_file = get_field('fsv_mp4_file_upload');

			echo '<video autoplay loop muted>';
				// If video file exists, install it.
				if ( $mp4_video_file ) { echo "<source src='{$mp4_video_file}' type='video/mp4'"; }
			echo '</video>';
			?>

		</div>
	</div>
	<?php } // End If FSV enabled statement?>




	<section class="container">
		<?php do_action( 'foundationpress_after_header' );
