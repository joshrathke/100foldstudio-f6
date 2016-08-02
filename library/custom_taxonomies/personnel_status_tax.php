<?php
/**
 *  Declare the Personnel Status Taxonomy
 *  This is the taxonomy used to classify each staff member by
 *  their status.
 */
add_action( 'init', 'personnel_status_tax', 1 );
function personnel_status_tax() {
    // Add new taxonomy, make it hierarchical (like categories)
    $labels = array(
        'name'              => _x( 'Personnel Statuses', 'taxonomy general name' ),
        'singular_name'     => _x( 'Personnel Status', 'taxonomy singular name' ),
        'search_items'      => __( 'Search Personnel Statuses' ),
        'all_items'         => __( 'All Personnel Statuses' ),
        'parent_item'       => __( 'Parent Personnel Status' ),
        'parent_item_colon' => __( 'Parent Personnel Status:' ),
        'edit_item'         => __( 'Edit Personnel Status' ),
        'update_item'       => __( 'Update Personnel Status' ),
        'add_new_item'      => __( 'Add New Personnel Status' ),
        'new_item_name'     => __( 'New Personnel Status' ),
        'menu_name'         => __( 'All Personnel Statuses' ),
    );
    $args = array(
        'hierarchical'      => true,
        'labels'            => $labels,
        'show_ui'           => true,
        'show_admin_column' => true,
        'show_in_quick_edit'=> false,
        'query_var'         => true,
        'rewrite'           => array( 'slug' => 'personnel-status' ),
    );
    register_taxonomy( 'personnel_status_tax', array( 'guest-author' ), $args );
}