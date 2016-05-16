<?php
/**
 *  Register Project Custom Post Type
 *  This file registers and deals with all of the data used by the
 *  Project custom post type.
 */

add_action( 'init', 'projects_cpt_init' );

function projects_cpt_init() {
	$labels = array(
		'name'               => _x( 'Projects', 'post type general name', '100foldstudio' ),
		'singular_name'      => _x( 'Project', 'post type singular name', '100foldstudio' ),
		'menu_name'          => _x( 'Projects', 'admin menu', '100foldstudio' ),
		'name_admin_bar'     => _x( 'Project', 'add new on admin bar', '100foldstudio' ),
		'add_new'            => _x( 'Add New', 'project', '100foldstudio' ),
		'add_new_item'       => __( 'Add New Project', '100foldstudio' ),
		'new_item'           => __( 'New Project', '100foldstudio' ),
		'edit_item'          => __( 'Edit Project', '100foldstudio' ),
		'view_item'          => __( 'View Project', '100foldstudio' ),
		'all_items'          => __( 'All Projects', '100foldstudio' ),
		'search_items'       => __( 'Search Projects', '100foldstudio' ),
		'parent_item_colon'  => __( 'Parent Projects:', '100foldstudio' ),
		'not_found'          => __( 'No projectss found.', '100foldstudio' ),
		'not_found_in_trash' => __( 'No projects found in Trash.', '100foldstudio' )
	);
	$args = array(
		'labels'             => $labels,
        'description'        => __( 'Description.', '100foldstudio' ),
		'public'             => true,
        'menu_icon'          => 'dashicons-portfolio',
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'query_var'          => true,
		'rewrite'            => array( 'slug' => 'projects' ),
		'capability_type'    => 'post',
		'has_archive'        => true,
		'hierarchical'       => false,
		'menu_position'      => 5,
		'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt')
	);
	register_post_type( 'project', $args );
}