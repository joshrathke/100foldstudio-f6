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

function localize_map_data() {
    
    // Initialize the $map_project_data array
    $map_project_data = array();
    $projects = get_posts('post_type=project&posts_per_page=-1');
    foreach ($projects as $project) {
        
        $countries = get_the_terms( $project->ID, 'project_country');
        if (!empty($countries)) {
            foreach ($countries as $country) {
                
                // Define Latitude and Longitude
                $coordinates = get_field( 'map_marker_position', 'project_country_' . $country->term_id );
                
                /**
                 *  Exclude United States since it should only be used as a parent.
                 *  This prevents double entries for projects from occuring.
                 */
                if ($country->slug !== 'united-states') {

                    if (!array_key_exists($country->term_id, $map_project_data)) {
                        $map_project_data[$country->term_id] = array (
                            'country_id'    => $project->ID,
                            'project_count' => 1,
                            'country_name'  => $country->name,
                            'country_coords'=> array (
                                'latitude' => $coordinates['lat'],
                                'longitude'=> $coordinates['lng'],
                            ),
                            'projects' => array(
                                $project->ID => array (
                                    'project_title'     => $project->post_title,
                                    'project_permalink' => get_permalink($project->ID),
                                )                
                            ),
                        );
                    } else {
                        $map_project_data[$country->term_id]['project_count']++;
                        $map_project_data[$country->term_id]['projects'][$project->ID] = array (
                            'project_title'     => $project->post_title,
                            'project_permalink' => get_permalink($project->ID),
                        ); 
                    }
                }
                
                
                //if (get_term($country->parent)->slug !== 'united-states') {
                //    echo 'working';   
                //}
            }
        }
    }
    
    wp_localize_script( 'project-archive-map', 'map_project_data', $map_project_data );
}