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
        'menu_name'         => __( 'Classification' ),
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
/**
 *  Replace Checkboxes with Radio Buttons
 *  Doing this allows us to restrict the user to only one selection,
 *  which prevents a project from being classified twice.
 */
class WordPress_Radio_Taxonomy {
	static $taxonomy = 'project_classification';
	static $taxonomy_metabox_id = 'project_classificationdiv';
	static $post_type= 'project';
    
	public static function load(){
		//Remove old taxonomy meta box  
		add_action( 'admin_menu', array(__CLASS__,'remove_meta_box'));  
		//Add new taxonomy meta box  
		add_action( 'add_meta_boxes', array(__CLASS__,'add_meta_box'));  
		//Load admin scripts
		add_action('admin_enqueue_scripts',array(__CLASS__,'admin_script'));
		//Load admin scripts
		add_action('wp_ajax_radio_tax_add_taxterm',array(__CLASS__,'ajax_add_term'));
	}
	public static function remove_meta_box(){  
   		remove_meta_box(static::$taxonomy_metabox_id, static::$post_type, 'normal');  
	} 
	public static function add_meta_box() {  
		add_meta_box( 'project_classification', 'Classification',array(__CLASS__,'metabox'), static::$post_type ,'side','core');  
	}  
        
	//Callback to set up the metabox  
	public static function metabox( $post ) {  
		//Get taxonomy and terms  
       	 $taxonomy = self::$taxonomy;
      
       	 //Set up the taxonomy object and get terms  
       	 $tax = get_taxonomy($taxonomy);  
       	 $terms = get_terms($taxonomy,array('hide_empty' => 0));  
      
       	 //Name of the form  
       	 $name = 'tax_input[' . $taxonomy . ']';  
      
       	 //Get current and popular terms  
       	 $popular = get_terms( $taxonomy, array( 'orderby' => 'count', 'order' => 'DESC', 'number' => 10, 'hierarchical' => false ) );  
       	 $postterms = get_the_terms( $post->ID,$taxonomy );  
       	 $current = ($postterms ? array_pop($postterms) : false);  
       	 $current = ($current ? $current->term_id : 0);  
       	 ?>  
      
		<div id="taxonomy-<?php echo $taxonomy; ?>" class="categorydiv">
			<!-- Display tabs-->
			<ul id="<?php echo $taxonomy; ?>-tabs" class="category-tabs">
				<li class="tabs"><a href="#<?php echo $taxonomy; ?>-all" tabindex="3"><?php echo $tax->labels->all_items; ?></a></li>
				<li class="hide-if-no-js"><a href="#<?php echo $taxonomy; ?>-pop" tabindex="3"><?php _e( 'Most Used' ); ?></a></li>
			</ul>

			<!-- Display taxonomy terms -->
			<div id="<?php echo $taxonomy; ?>-all" class="tabs-panel">
				<ul id="<?php echo $taxonomy; ?>checklist" class="list:<?php echo $taxonomy?> categorychecklist form-no-clear">
				<?php foreach($terms as $term){
       				 $id = $taxonomy.'-'.$term->term_id;
					$value= (is_taxonomy_hierarchical($taxonomy) ? "value='{$term->term_id}'" : "value='{$term->term_slug}'");
				        echo "<li id='$id'><label class='selectit'>";
				        echo "<input type='radio' id='in-$id' name='{$name}'".checked($current,$term->term_id,false)." {$value} />$term->name<br />";
				        echo "</label></li>";
		       	 }?>
				</ul>
			</div>

			<!-- Display popular taxonomy terms -->
			<div id="<?php echo $taxonomy; ?>-pop" class="tabs-panel" style="display: none;">
				<ul id="<?php echo $taxonomy; ?>checklist-pop" class="categorychecklist form-no-clear" >
				<?php foreach($popular as $term){
				        $id = 'popular-'.$taxonomy.'-'.$term->term_id;
					$value= (is_taxonomy_hierarchical($taxonomy) ? "value='{$term->term_id}'" : "value='{$term->term_slug}'");
				        echo "<li id='$id'><label class='selectit'>";
				        echo "<input type='radio' id='in-$id'".checked($current,$term->term_id,false)." {$value} />$term->name<br />";
				        echo "</label></li>";
				}?>
				</ul>
			</div>

			 <p id="<?php echo $taxonomy; ?>-add" class="">
				<label class="screen-reader-text" for="new<?php echo $taxonomy; ?>"><?php echo $tax->labels->add_new_item; ?></label>
				<input type="text" name="new<?php echo $taxonomy; ?>" id="new<?php echo $taxonomy; ?>" class="form-required form-input-tip" value="<?php echo esc_attr( $tax->labels->new_item_name ); ?>" tabindex="3" aria-required="true"/>
				<input type="button" id="" class="radio-tax-add button" value="<?php echo esc_attr( $tax->labels->add_new_item ); ?>" tabindex="3" />
				<?php wp_nonce_field( 'radio-tax-add-'.$taxonomy, '_wpnonce_radio-add-tag', false ); ?>
			</p>
		</div>
        <?php  
    }
	 public static function admin_script(){  
		wp_register_script( 'radiotax', get_template_directory_uri() . '/js/radiotax.js', array('jquery'), null, true );
		wp_localize_script( 'radiotax', 'radio_tax', array('slug'=>self::$taxonomy));
		wp_enqueue_script( 'radiotax' );  
	}
	public function ajax_add_term(){
		$taxonomy = !empty($_POST['taxonomy']) ? $_POST['taxonomy'] : '';
		$term = !empty($_POST['term']) ? $_POST['term'] : '';
		$tax = get_taxonomy($taxonomy);
		check_ajax_referer('radio-tax-add-'.$taxonomy, '_wpnonce_radio-add-tag');
		if(!$tax || empty($term))
			exit();
		if ( !current_user_can( $tax->cap->edit_terms ) )
			die('-1');
		$tag = wp_insert_term($term, $taxonomy);
		if ( !$tag || is_wp_error($tag) || (!$tag = get_term( $tag['term_id'], $taxonomy )) ) {
			//TODO Error handling
			exit();
		}
	
		$id = $taxonomy.'-'.$tag->term_id;
		$name = 'tax_input[' . $taxonomy . ']';
		$value= (is_taxonomy_hierarchical($taxonomy) ? "value='{$tag->term_id}'" : "value='{$term->tag_slug}'");
		$html ='<li id="'.$id.'"><label class="selectit"><input type="radio" id="in-'.$id.'" name="'.$name.'" '.$value.' />'. $tag->name.'</label></li>';
	
		echo json_encode(array('term'=>$tag->term_id,'html'=>$html));
		exit();
	}
}
WordPress_Radio_Taxonomy::load();
?>