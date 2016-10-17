<?php
/**
 *  Register User Demographic Post Type
 *  This file registers and deals with all of the data used by the
 *  User Demogrpahic custom post type.
 */

add_action( 'init', 'user_demographic_cpt_init' );

function user_demographic_cpt_init() {
	$labels = array(
		'name'               => _x( 'Demographic', 'post type general name', '100foldstudio' ),
		'singular_name'      => _x( 'Demographic', 'post type singular name', '100foldstudio' ),
		'menu_name'          => _x( 'Demographics', 'admin menu', '100foldstudio' ),
		'name_admin_bar'     => _x( 'Demographic', 'add new on admin bar', '100foldstudio' ),
		'add_new'            => _x( 'Add New', 'project', '100foldstudio' ),
		'add_new_item'       => __( 'Add New Demographic', '100foldstudio' ),
		'new_item'           => __( 'New Demographic', '100foldstudio' ),
		'edit_item'          => __( 'Edit Demographic', '100foldstudio' ),
		'view_item'          => __( 'View Demographic', '100foldstudio' ),
		'all_items'          => __( 'All Demographics', '100foldstudio' ),
		'search_items'       => __( 'Search Demographics', '100foldstudio' ),
		'parent_item_colon'  => __( 'Parent Demographics:', '100foldstudio' ),
		'not_found'          => __( 'No demographics found.', '100foldstudio' ),
		'not_found_in_trash' => __( 'No demographicss found in Trash.', '100foldstudio' )
	);
	$args = array(
		'labels'             => $labels,
        'description'        => __( 'Description', '100foldstudio' ),
		'public'             => true,
        'menu_icon'          => 'dashicons-groups',
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'query_var'          => true,
		'rewrite'            => array( 'slug' => 'demographic' ),
		'capability_type'    => 'post',
		'has_archive'        => false,
		'hierarchical'       => false,
		'menu_position'      => 5,
		'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt')
	);
	register_post_type( 'user-demographic', $args );
}