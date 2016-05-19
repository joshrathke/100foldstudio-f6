<?php
/**
 *  Declare the Project Classification Taxonomy
 *  This is the taxonomy used to classify each project by either
 *  geographic region, type of project, or any other form of
 *  classification needed to best organize the projects on the page.
 */
add_action( 'init', 'project_classification_tax', 1 );
function project_classification_tax() {
    // Add new taxonomy, make it hierarchical (like categories)
    $labels = array(
        'name'              => _x( 'Classification', 'taxonomy general name' ),
        'singular_name'     => _x( 'Classification', 'taxonomy singular name' ),
        'search_items'      => __( 'Search Classifications' ),
        'all_items'         => __( 'All Classifications' ),
        'parent_item'       => __( 'Parent Classification' ),
        'parent_item_colon' => __( 'Parent Classification:' ),
        'edit_item'         => __( 'Edit Classification' ),
        'update_item'       => __( 'Update Classification' ),
        'add_new_item'      => __( 'Add New Classification' ),
        'new_item_name'     => __( 'New Classification Name' ),
        'menu_name'         => __( 'All Classifications' ),
    );
    $args = array(
        'hierarchical'      => true,
        'labels'            => $labels,
        'show_ui'           => true,
        'show_admin_column' => true,
        'show_in_quick_edit'=> false,
        'query_var'         => true,
        'rewrite'           => array( 'slug' => 'project-classifications' ),
    );
    register_taxonomy( 'project_classification', array( 'project' ), $args );
}