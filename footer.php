<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the "off-canvas-wrap" div and all content after.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

$tw_consumer_key = get_field( 'consumer_key', 'option' );
$tw_consumer_secret = get_field( 'consumer_secret', 'option' );
$tw_access_token = get_field( 'access_token', 'option' );
$tw_access_token_secret = get_field( 'access_token_secret', 'option' );

/** Add Twitter OAuth PHP Plugin **/
//require_once "library/twitteroauth/autoload.php";
//use Abraham\TwitterOAuth\TwitterOAuth;

//$connection = new TwitterOAuth($tw_consumer_key, $tw_consumer_secret, $tw_access_token, $tw_access_token_secret);
//$tweets = $connection->get("statuses/user_timeline", array("count" => 3, "exclude_replies" => true));

?>

</section>

		<div id="footer-container">
			<footer id="footer">
				<?php do_action( 'foundationpress_before_footer' ); ?>
				
                <div class="row">
                    <div class="columns medium-4">
                        <h5>Twitter<div class="follow-button"><a href="https://twitter.com/100foldstudio">Follow</a></div></h5>

                        <?php
                        // Print Tweets
                        foreach($tweets as $tweet) :
                            echo '<div class="tweet">';
                                echo $tweet->text;
                            echo '</div>';
                        endforeach ?>

                    </div>
                    
                    <div class="columns medium-4">
                    <h5>Connect</h5>
                        <?php echo do_shortcode('[gravityform id="1" title="false" description="false"]'); ?>
                    </div>

                    <div class="columns medium-4 join-us">
                        <h5>Join Us</h5>
                        <?php _100foldstudio_join_us_nav(); ?>
                    </div>
                </div>
                
				<?php do_action( 'foundationpress_after_footer' ); ?>
			</footer>
            
            <div class="footer-sub-menu">
                <?php _100foldstudio_copyright_bar_nav(); ?>    
            </div>
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
