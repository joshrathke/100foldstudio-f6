<?php
/**
 *  Declare the Project Country Taxonomy
 *  This is the taxonomy used to classify each project by either
 *  its country, or province/state within that country.
 */
add_action( 'init', 'project_country_tax', 1 );
function project_country_tax() {
    // Add new taxonomy, make it hierarchical (like categories)
    $labels = array(
        'name'              => _x( 'Countries', 'taxonomy general name' ),
        'singular_name'     => _x( 'Country', 'taxonomy singular name' ),
        'search_items'      => __( 'Search Countries' ),
        'all_items'         => __( 'All Countries' ),
        'parent_item'       => __( 'Parent Country' ),
        'parent_item_colon' => __( 'Parent Country:' ),
        'edit_item'         => __( 'Edit Country' ),
        'update_item'       => __( 'Update Country' ),
        'add_new_item'      => __( 'Add New Country' ),
        'new_item_name'     => __( 'New Country Name' ),
        'menu_name'         => __( 'All Countries' ),
    );
    $args = array(
        'hierarchical'      => true,
        'labels'            => $labels,
        'show_ui'           => true,
        'show_admin_column' => true,
        'show_in_quick_edit'=> false,
        'query_var'         => true,
        'rewrite'           => array( 'slug' => 'project-countries' ),
    );
    register_taxonomy( 'project_country', array( 'project' ), $args );
}