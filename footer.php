<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the "off-canvas-wrap" div and all content after.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */
?>

</section>
        
        <div class="demographic-footer">
            <div class="row">
                <?php
                // Get demographics and display links to them.
                $demographics = get_posts(array('post_type' => 'user-demographic'));
                
                foreach ($demographics as $demographic) {
                    echo '<div class="medium-4 columns demographic-link">';
                        echo '<a href="' . get_permalink($demographic->ID) . '">';
                        echo $demographic->post_title;
                        echo '</a>';
                    echo '</div>';
                }
                ?>
            </div>
        </div>

		<div id="footer-container">
			<footer id="footer">
				<div class="row">
                    <div class="medium-3 columns">
                        <img src="<?php echo get_bloginfo('template_url'); ?>/assets/images/gray_on_white_linear.png" />
                        <div class="contact-info">
                            <ul>
                                <li>100 Fold Studio</li>
                                <li>501 Blacktail Rd.</li>
                                <li>Lakeside MT, 59922</li>
                                <li></li>
                                <li>Copyright 2017</li>
                            </ul>
                        </div>
                    </div>
                    <div class="medium-3 columns twitter-feed">
                        <h6>Twitter</h6>
                        <div class="tweet">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed enim id ligula volutpat vulputate.
                        </div>
                        <div class="tweet">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed enim id ligula volutpat vulputate.
                        </div>
                        <div class="tweet">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed enim id ligula volutpat vulputate.
                        </div>
                    </div>
                    <div class="medium-6 columns instagram-feed">
                        <h6>Instagram</h6>
                        <div class="row medium-up-6">
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                            <div class="column column-block"><img src="http://placehold.it/150x150" /></div>
                        </div>
                    </div>
                </div>
			</footer>
		</div>
        <div class="footer-sub-menu">
            <?php _100foldstudio_copyright_bar_nav(); ?>    
        </div>

		<?php do_action( 'foundationpress_layout_end' ); ?>

<?php if ( get_theme_mod( 'wpt_mobile_menu_layout' ) == 'offcanvas' ) : ?>
		</div><!-- Close off-canvas wrapper inner -->
	</div><!-- Close off-canvas wrapper -->
</div><!-- Close off-canvas content wrapper -->
<?php endif; ?>


<?php wp_footer(); ?>
<?php do_action( 'foundationpress_before_closing_body' ); ?>
</body>
</html>
