<?php
/**
 *  Function Alert Banner
 *  This function builds and displays the alert banner
 *  when enabled on the site.
 */
function alert_banner() {
    
    // Check if Alert Banner is enabled.
    if (get_field('enable_alert_banner', 'option')) {

        // Define Color Class
        $color_class = get_field('alert_banner_color', 'option');
                                                     
        // Define Due Date
        $due_date = new DateTime(get_field('due_date', 'option'));
        $due_date = $due_date->format(get_field('due_date_display_format', 'option'));
    ?>
    
    <div class="alert-banner <?php echo $color_class; ?>">
        <span class="alert-banner-text"><?php the_field('alert_banner_text', 'option'); ?>
            <span class="alert-banner-due-date"><?php echo $due_date; ?></span>
            <a href="<?php the_field('alert_banner_link_url', 'option'); ?>"><?php the_field('alert_banner_link_text', 'option'); ?></a>
        </span>
    </div>

<?php }
}

add_action('foundationpress_before_title_bar', 'alert_banner');

?>