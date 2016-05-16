<?php
/**
 *  Declare the Project Continent Taxonomy
 *  This is the taxonomy used to classify each project by the
 *  continent it resides on.
 */
add_action( 'init', 'project_continent_tax', 1 );
function project_continent_tax() {
    // Add new taxonomy, make it hierarchical (like categories)
    $labels = array(
        'name'              => _x( 'Continents', 'taxonomy general name' ),
        'singular_name'     => _x( 'Continent', 'taxonomy singular name' ),
        'search_items'      => __( 'Search Continents' ),
        'all_items'         => __( 'All Continents' ),
        'parent_item'       => __( 'Parent Continent' ),
        'parent_item_colon' => __( 'Parent Continent:' ),
        'edit_item'         => __( 'Edit Continent' ),
        'update_item'       => __( 'Update Continent' ),
        'add_new_item'      => __( 'Add New Continent' ),
        'new_item_name'     => __( 'New Continent Name' ),
        'menu_name'         => __( 'All Continents' ),
    );
    $args = array(
        'hierarchical'      => true,
        'labels'            => $labels,
        'show_ui'           => true,
        'show_admin_column' => true,
        'show_in_quick_edit'=> false,
        'query_var'         => true,
        'rewrite'           => array( 'slug' => 'project-continent' ),
    );
    register_taxonomy( 'project_continent', array( 'project' ), $args );
}